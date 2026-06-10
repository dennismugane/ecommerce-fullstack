# Production Deployment Troubleshooting Guide
## E-Commerce Platform on AWS — Spring Boot + MySQL + CloudFront

**Author:** Dennis Muigo  
**Date:** May 2026  
**Stack:** Spring Boot 3.4 · MySQL 8 · Docker · AWS EC2 · RDS · CloudFront · ALB · Terraform

---

## Overview

This document captures the real production issues encountered during the deployment of the e-commerce platform to AWS, how each was diagnosed, and how it was resolved. Every issue was solved without using the AWS Console — all fixes applied via CLI, Terraform, and SSH.

---

## Issue 1 — RDS Connection Failure: Double Port in JDBC URL

### Symptom

Spring Boot container kept restarting with:

```
Caused by: java.net.UnknownHostException:
ecommerce-prod-mysql.cib4ukqie3dj.us-east-1.rds.amazonaws.com:3306:
invalid IPv6 address literal
```

### Root Cause

Terraform's `aws_db_instance` outputs the RDS endpoint **including the port**:

```
ecommerce-prod-mysql.cib4ukqie3dj.us-east-1.rds.amazonaws.com:3306
```

The `userdata.sh` script was then constructing the JDBC URL by appending `:3306` again:

```bash
DB_URL=jdbc:mysql://${rds_endpoint}:3306/${db_name}
```

This produced a malformed URL:

```
jdbc:mysql://ecommerce-prod-mysql...amazonaws.com:3306:3306/ecommerce
```

Java's MySQL driver tried to parse `:3306:3306` as an IPv6 address literal — hence the `invalid IPv6 address literal` error.

### Troubleshooting Commands

```bash
# Check what URL the container was actually using
sudo docker inspect ecommerce-backend \
  | python3 -c "import json,sys; \
    env=json.load(sys.stdin)[0]['Config']['Env']; \
    [print(e) for e in env if 'DB_URL' in e or 'DATASOURCE' in e]"

# Check the env file on EC2
sudo cat /opt/ecommerce/.env | grep RDS_ENDPOINT

# Check the generated docker-compose
sudo cat /opt/ecommerce/docker-compose.yml | grep -E "DB_URL|DATASOURCE"
```

### Resolution

Removed the hardcoded `:3306` from the JDBC URL construction since the Terraform RDS endpoint output already includes it:

```bash
# Before (broken)
DB_URL=jdbc:mysql://${rds_endpoint}:3306/${db_name}?useSSL=false

# After (fixed)
DB_URL=jdbc:mysql://${rds_endpoint}/${db_name}?useSSL=false&allowPublicKeyRetrieval=true
```

Also added `allowPublicKeyRetrieval=true` to prevent a secondary MySQL 8 authentication error.

---

## Issue 2 — Container Not Starting: DB_PASSWORD Empty in Environment

### Symptom

Container started but crashed with:

```
Caused by: java.sql.SQLException:
Access denied for user 'admin'@'10.0.2.224' (using password: YES)
```

Inspection showed `DB_PASSWORD` was blank:

```
DB_PASSWORD          ← empty
DB_USERNAME=admin    ← correct
MYSQL_PASSWORD=MySecurePass123!  ← correct but wrong variable name
```

### Root Cause

Spring Boot's `application-prod.properties` reads `${DB_PASSWORD}`:

```properties
spring.datasource.password=${DB_PASSWORD}
```

But `userdata.sh` was only writing `MYSQL_PASSWORD` to the `.env` file, not `DB_PASSWORD`. The docker-compose `environment:` block used `$${MYSQL_PASSWORD}` (Terraform escape syntax) which rendered as `${MYSQL_PASSWORD}` — but docker-compose couldn't resolve it because the variable wasn't in scope at container runtime.

### Troubleshooting Commands

```bash
# Check what environment variables the container actually has
sudo docker inspect ecommerce-backend \
  | python3 -c "import json,sys; \
    env=json.load(sys.stdin)[0]['Config']['Env']; \
    [print(e) for e in env if any(x in e for x in \
    ['DB_USER','DB_PASS','MYSQL_USER','MYSQL_PASS','DB_USERNAME'])]"

# Verify env file contents
sudo cat /opt/ecommerce/.env | grep -E "MYSQL_USER|MYSQL_PASSWORD|DB_"

# Check docker logs for the actual error
sudo docker logs ecommerce-backend --tail 50
```

### Resolution

Added `DB_PASSWORD`, `DB_USERNAME`, and `DB_URL` explicitly to the `.env` file in `userdata.sh` so they are passed directly to the container via `env_file` rather than relying on docker-compose variable interpolation:

```bash
cat > /opt/ecommerce/.env <<EOF
MYSQL_PASSWORD=$DB_PASSWORD
DB_PASSWORD=$DB_PASSWORD          # ← added: matches Spring Boot property
DB_USERNAME=${db_username}        # ← added: matches Spring Boot property
DB_URL=jdbc:mysql://${rds_endpoint}/${db_name}?useSSL=false&allowPublicKeyRetrieval=true
JWT_SECRET=$JWT_SECRET
ALLOWED_ORIGINS=${allowed_origins}
# ... other vars
EOF
```

Then simplified docker-compose to use only `env_file` and removed the `environment:` interpolation block entirely to avoid variable resolution issues.

---

## Issue 3 — Userdata Script Silently Failing: set -euo pipefail

### Symptom

Every new EC2 instance launched by the ASG showed Docker installed in the log but nothing after — no secrets fetched, no container started, no `=== USERDATA COMPLETE ===` marker. The log always cut off at the same point.

### Root Cause

The script started with:

```bash
set -euo pipefail
exec > >(tee /var/log/userdata.log | logger -t userdata) 2>&1
```

Two problems combined:

1. **`-u` flag** (treat unset variables as errors) — after `unset DB_PASSWORD JWT_SECRET`, any subsequent reference to these variables caused an immediate silent exit.
2. **`exec > >(tee ...)` process substitution** — this creates a subshell. When `systemctl start docker` restarted the network stack, it killed the subshell, which caused the parent script to exit via `pipefail`.

### Troubleshooting Commands

```bash
# Check exactly where the log cuts off
sudo cat /var/log/userdata.log | tail -30

# Check cloud-init error logs
sudo cat /var/log/cloud-init.log | grep -A 10 "Failed\|Error\|error" | tail -50

# Check the rendered script on the instance
sudo cat /var/lib/cloud/instance/scripts/part-001 | head -60

# Run the script manually with debug tracing
sudo bash -x /var/lib/cloud/instance/scripts/part-001 2>&1 | tail -50
```

### Resolution

Made three changes:

```bash
# Before (broken)
set -euo pipefail
exec > >(tee /var/log/userdata.log | logger -t userdata) 2>&1

# After (fixed)
exec > /var/log/userdata.log 2>&1
set -eo pipefail   # removed -u flag
```

Also replaced `systemctl enable --now docker` (which restarts networking) with:

```bash
systemctl enable docker
systemctl start docker
sleep 15
systemctl is-active docker || { echo "=== FAILED: Docker not running"; exit 1; }
```

Added `=== marker ===` echo statements after every step so failures are immediately visible in the log.

---

## Issue 4 — EC2 Instance Out of Disk Space

### Symptom

Docker image pull failed with:

```
failed to register layer:
write /opt/java/openjdk/lib/modules: no space left on device
```

### Root Cause

The default EC2 root volume from the Amazon Linux 2023 AMI was only **2GB**. After installing Docker, containerd, and dependencies (~286MB), there was insufficient space to extract the Spring Boot Docker image (~542MB compressed, ~1.2GB extracted).

### Troubleshooting Commands

```bash
# Check disk usage
df -h

# Check block device sizes
sudo lsblk

# Try to grow partition (failed — volume itself was 2GB)
sudo growpart /dev/nvme0n1 1
# Output: NOCHANGE: partition 1 is size 4169695. it cannot be grown
```

### Resolution — Two Parts

**Immediate fix (existing instance):**

```bash
# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
  --profile terraform --region us-east-1 \
  --filters "Name=tag:Name,Values=ecommerce-prod-backend" \
            "Name=instance-state-name,Values=running" \
  --query "Reservations[].Instances[0].InstanceId" --output text)

# Get volume ID
VOLUME_ID=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID --profile terraform --region us-east-1 \
  --query "Reservations[].Instances[].BlockDeviceMappings[0].Ebs.VolumeId" \
  --output text)

# Expand volume to 20GB
aws ec2 modify-volume \
  --volume-id $VOLUME_ID --size 20 \
  --profile terraform --region us-east-1

# After AWS expands it, grow the partition and filesystem
sleep 30
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /
df -h
```

**Permanent fix (Terraform):**

Added `block_device_mappings` to the `aws_launch_template` resource:

```hcl
block_device_mappings {
  device_name = "/dev/xvda"
  ebs {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
  }
}
```

---

## Issue 5 — IMDSv2 Region Fetch Returning Empty

### Symptom

Secrets Manager fetch failed silently. Manual test showed:

```bash
REGION=$(curl -sf http://169.254.169.254/latest/meta-data/placement/region)
echo "Region: $REGION"
# Output: Region:   ← empty
```

This caused:
```
Invalid endpoint: https://secretsmanager..amazonaws.com
```

(double dot = empty region substituted into URL)

### Root Cause

Amazon Linux 2023 enforces **IMDSv2** by default, which requires a token for metadata requests. The script was using the IMDSv1 style `curl` without a token.

### Troubleshooting Commands

```bash
# Test IMDSv1 (fails on AL2023)
curl -sf http://169.254.169.254/latest/meta-data/placement/region

# Test IMDSv2 (works)
TOKEN=$(curl -sf -X PUT "http://169.254.169.254/latest/api/token" \
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
REGION=$(curl -sf -H "X-aws-ec2-metadata-token: $TOKEN" \
  http://169.254.169.254/latest/meta-data/placement/region)
echo "Region: $REGION"
```

### Resolution

Since the deployment region is fixed, hardcoded the region directly in `userdata.sh` to avoid IMDSv2 complexity entirely:

```bash
# Before (broken on AL2023)
REGION=$(curl -sf http://169.254.169.254/latest/meta-data/placement/region)

# After (simple and reliable)
REGION="us-east-1"
```

---

## Issue 6 — Wrong Docker Compose File Being Generated

### Symptom

The generated docker-compose in `/opt/ecommerce/docker-compose.yml` had variable interpolation issues — `DB_PASSWORD` was empty, `DB_URL` had wrong format. The repo already had a correct `docker-compose.prod.yml` but it was being ignored.

### Root Cause

`userdata.sh` was generating its own docker-compose file inline using a Terraform `templatefile()` heredoc. This created two sources of truth and made it easy for bugs to creep in through Terraform variable escaping (`${}` vs `$${}`).

### Resolution

Changed `userdata.sh` to clone the repo and use `docker-compose.prod.yml` directly:

```bash
# Clone repo
git clone https://github.com/dennismugane/ecommerce-fullstack.git /tmp/ecommerce-repo

# Use the version-controlled prod file
cp /tmp/ecommerce-repo/docker-compose.prod.yml /opt/ecommerce/docker-compose.yml
```

Benefits:
- Single source of truth for docker-compose configuration
- Changes to docker-compose deploy via git push, not Terraform
- Eliminates Terraform template escaping bugs entirely

---

## Issue 7 — ALLOWED_ORIGINS Empty: CORS Blocked in Browser

### Symptom

Browser console showed:

```
Access to XMLHttpRequest at 'https://d2fxqzyyexmaqr.cloudfront.net/api/auth/register'
from origin 'https://d23yij5kgrtj4d.cloudfront.net' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Root Cause

`terraform.tfvars` had:

```hcl
allowed_origins = ""   # ← empty value
```

This meant the `.env` file on EC2 had `ALLOWED_ORIGINS=` empty, so Spring Boot's CORS config defaulted to `http://localhost:3000` and rejected all CloudFront requests.

### Troubleshooting Commands

```bash
# Check what value the container has
sudo docker inspect ecommerce-backend \
  | python3 -c "import json,sys; \
    env=json.load(sys.stdin)[0]['Config']['Env']; \
    [print(e) for e in env if 'ORIGIN' in e]"

# Test CORS preflight directly against the app
curl -v -X OPTIONS \
  http://localhost:8080/api/auth/register \
  -H "Origin: https://d23yij5kgrtj4d.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" 2>&1 | grep -i "access-control"
```

### Resolution

Fixed `terraform.tfvars`:

```hcl
allowed_origins = "https://d23yij5kgrtj4d.cloudfront.net"
```

Also added it to `~/.bashrc` permanently:

```bash
export TF_VAR_allowed_origins="https://d23yij5kgrtj4d.cloudfront.net"
```

---

## Issue 8 — CloudFront Stripping CORS Response Headers

### Symptom

Even after fixing `ALLOWED_ORIGINS` in Spring Boot, the browser still blocked requests. Testing directly against the app worked:

```bash
# Direct to app — CORS headers present ✅
curl -v -X OPTIONS http://localhost:8080/api/auth/register \
  -H "Origin: https://d23yij5kgrtj4d.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" 2>&1 | grep "access-control"
# < Access-Control-Allow-Origin: https://d23yij5kgrtj4d.cloudfront.net
```

But through CloudFront — CORS headers missing:

```bash
# Through CloudFront — CORS headers stripped ❌
curl -v -X OPTIONS https://d2fxqzyyexmaqr.cloudfront.net/api/auth/register \
  -H "Origin: https://d23yij5kgrtj4d.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" 2>&1 | grep "access-control"
# (no output)
```

### Root Cause

CloudFront was not configured to forward or preserve CORS response headers from the origin. By default CloudFront strips headers it doesn't know about — including `Access-Control-Allow-Origin`.

### Resolution

Added a `aws_cloudfront_response_headers_policy` resource to the CloudFront module and attached it to the backend distribution's cache behavior:

```hcl
resource "aws_cloudfront_response_headers_policy" "cors" {
  name = "ecommerce-${var.environment}-cors-policy"

  cors_config {
    access_control_allow_credentials = true

    access_control_allow_headers {
      items = [
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
      ]
    }

    access_control_allow_methods {
      items = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"]
    }

    access_control_allow_origins {
      items = ["https://d23yij5kgrtj4d.cloudfront.net"]
    }

    access_control_max_age_sec = 3600
    origin_override            = false
  }
}
```

Note: CloudFront rejects `*` as an allowed header when `allowCredentials` is `true` — specific headers must be listed explicitly.

Attached to the backend distribution:

```hcl
default_cache_behavior {
  # ... existing config ...
  response_headers_policy_id = aws_cloudfront_response_headers_policy.cors.id
}
```

### Verification

```bash
curl -v -X OPTIONS \
  https://d2fxqzyyexmaqr.cloudfront.net/api/auth/register \
  -H "Origin: https://d23yij5kgrtj4d.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" 2>&1 | grep -i "access-control"

# Output:
# < access-control-allow-credentials: true
# < access-control-allow-origin: https://d23yij5kgrtj4d.cloudfront.net
# < access-control-allow-methods: POST,GET,HEAD,PATCH,DELETE,OPTIONS,PUT
# < access-control-max-age: 3600
```

---

## Final Architecture — What's Running in Production

```
User Browser
     │
     ├── GET /  ──────────────────────────────────────────────────────────────────┐
     │                                                                             │
     ▼                                                                             ▼
CloudFront (Frontend)                                                    CloudFront (Backend)
d23yij5kgrtj4d.cloudfront.net                                           d2fxqzyyexmaqr.cloudfront.net
     │                                                                             │
     ▼                                                                             ▼
S3 Bucket                                                                AWS ALB
React build artifacts                                                    ecommerce-prod-alb
     │                                                                             │
     └── Static files served via OAC                                              ▼
                                                                         EC2 (Auto Scaling Group)
                                                                         Spring Boot :8080
                                                                         Docker container
                                                                                   │
                                                                                   ▼
                                                                         RDS MySQL 8.0
                                                                         Private subnet
                                                                         ecommerce_db
```

---

## Key Lessons Learned

| Lesson | Detail |
|--------|--------|
| Terraform RDS endpoint includes port | Never append `:3306` manually to `rds_endpoint` output |
| AL2023 enforces IMDSv2 | Hardcode region or use token-based metadata fetch |
| `set -euo pipefail` in userdata | Remove `-u` flag — unset vars after secrets fetch cause silent exits |
| `exec > >(tee ...)` in userdata | Use direct redirect `exec > /var/log/userdata.log 2>&1` instead |
| Default EC2 volume is 2GB | Always set `volume_size = 20` in launch template for Java apps |
| CloudFront strips CORS headers | Add `aws_cloudfront_response_headers_policy` to backend distribution |
| CloudFront rejects `*` headers with credentials | List specific headers when `allowCredentials = true` |
| Two docker-compose files | Use repo's `docker-compose.prod.yml` — single source of truth |
| Empty terraform.tfvars values | Always verify all variables are set before applying |

---

## Useful Diagnostic Commands Reference

```bash
# Check userdata execution log
sudo cat /var/log/userdata.log

# Check what rendered script ran on instance
sudo cat /var/lib/cloud/instance/scripts/part-001 | head -60

# Check container environment variables
sudo docker inspect <container> \
  | python3 -c "import json,sys; \
    [print(e) for e in json.load(sys.stdin)[0]['Config']['Env']]"

# Check container logs
sudo docker logs <container> --tail 100

# Test RDS connectivity from EC2
nc -zv <rds-endpoint> 3306

# Test CORS preflight locally on EC2
curl -v -X OPTIONS http://localhost:8080/api/auth/register \
  -H "Origin: https://your-frontend.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" 2>&1 | grep -i "access-control"

# Test CORS through CloudFront
curl -v -X OPTIONS https://your-backend.cloudfront.net/api/auth/register \
  -H "Origin: https://your-frontend.cloudfront.net" \
  -H "Access-Control-Request-Method: POST" 2>&1 | grep -i "access-control"

# Check disk space
df -h && sudo lsblk

# Check ASG instance refresh status
aws autoscaling describe-instance-refreshes \
  --auto-scaling-group-name <asg-name> \
  --profile terraform --region us-east-1 \
  --query "InstanceRefreshes[0].{Status:Status,Percentage:PercentageComplete}" \
  --output table

# Force unlock Terraform state after interrupted plan
terraform force-unlock <lock-id>

# Expand EBS volume without stopping instance
aws ec2 modify-volume --volume-id <vol-id> --size 20 --profile terraform --region us-east-1
sleep 30
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs /
```