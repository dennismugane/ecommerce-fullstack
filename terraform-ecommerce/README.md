# Ecommerce Infrastructure — Terraform

## Architecture

```
Internet
   │
   ├─── CloudFront (Frontend) ──► S3 Bucket (React/Vite build)
   │         OAC – no public bucket
   │
   └─── CloudFront (Backend) ───► ALB (HTTP/80) ──► EC2 ASG
                                                        │
                                                       RDS MySQL (private subnet)

Remote State: S3 bucket + DynamoDB lock table
```

## Directory Structure

```
terraform-ecommerce/
├── main.tf                          # Root: backend config + module calls
├── variables.tf                     # All input variables
├── outputs.tf                       # CloudFront URLs, bucket name
├── bootstrap.sh                     # One-time state backend creation
├── modules/
│   ├── vpc/        main.tf          # VPC, subnets, IGW, NAT, route tables
│   ├── ec2/        main.tf          # ALB, ASG, launch template, security groups
│   │               userdata.sh      # Installs Docker, writes .env, starts compose
│   ├── rds/        main.tf          # MySQL 8 RDS (private subnet, encrypted)
│   ├── s3/         main.tf          # Frontend bucket (OAC, no public access)
│   ├── cloudfront/ main.tf          # Frontend dist (S3) + backend dist (ALB proxy)
│   └── iam/        main.tf          # EC2 role, SSM, CloudWatch, tfstate resources
└── environments/
    └── prod/
        └── terraform.tfvars.example # Fill this in → terraform.tfvars
```

## Prerequisites

- Terraform >= 1.6
- AWS CLI configured (`aws configure`)
- An existing EC2 key pair in your region
- Docker Hub account with the backend image pushed

## First-Time Setup

### Step 1 — Bootstrap remote state

```bash
chmod +x bootstrap.sh
./bootstrap.sh
```

This creates the S3 bucket and DynamoDB table that Terraform uses to store state.

### Step 2 — Configure variables

```bash
cp environments/prod/terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

**Never commit secrets.** Use environment variables for sensitive values:

```bash
export TF_VAR_db_password="your-rds-password"
export TF_VAR_jwt_secret="your-jwt-secret"
```

### Step 3 — Init & apply

```bash
terraform init
terraform plan
terraform apply
```

### Step 4 — Deploy frontend

After `apply`, upload your built frontend to S3:

```bash
# Get bucket name from Terraform output
BUCKET=$(terraform output -raw frontend_bucket_name)

# Build and upload (adjust dist/ to your build output dir)
npm run build
aws s3 sync dist/ s3://$BUCKET --delete

# Invalidate CloudFront cache
CF_ID=$(terraform output -raw frontend_cloudfront_url | sed 's|https://||;s|\..*||')
aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"
```

### Step 5 — Update ALLOWED_ORIGINS

Once you have your CloudFront URLs, update `allowed_origins` in `terraform.tfvars`:

```hcl
allowed_origins = "https://dxxxxxxx.cloudfront.net"
```

Then re-apply:

```bash
terraform apply
```

## State Backend

Terraform state is stored remotely so your team can collaborate safely:

| Resource | Purpose |
|---|---|
| S3 bucket `ecommerce-tfstate-prod` | Stores `terraform.tfstate` (encrypted, versioned) |
| DynamoDB table `ecommerce-tfstate-lock` | Prevents concurrent applies |

## Security Notes

- RDS is in a **private subnet** — only reachable from EC2 security group
- S3 frontend bucket blocks all public access — served via CloudFront OAC only
- EC2 instances have **SSM Session Manager** — no need to open port 22 publicly
- Secrets (DB password, JWT) are passed via userdata and stored in `/opt/ecommerce/.env` (chmod 600)
- For production hardening, consider AWS Secrets Manager instead of userdata env vars

## Updating the Backend Image

SSH into EC2 (or use SSM) and run:

```bash
cd /opt/ecommerce
IMAGE_TAG=v1.2.3 docker-compose --env-file .env pull
IMAGE_TAG=v1.2.3 docker-compose --env-file .env up -d
```

Or update `image_tag` in `terraform.tfvars` and `terraform apply` — the ASG will replace instances with the new launch template.

## Teardown

```bash
terraform destroy
```

Note: RDS has `deletion_protection = true` and `prevent_destroy` on the state bucket.
Disable these manually before running destroy.
