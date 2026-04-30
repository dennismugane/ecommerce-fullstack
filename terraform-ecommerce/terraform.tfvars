# environments/prod/terraform.tfvars
# Copy this file and fill in your values.
# Never commit secrets — use TF_VAR_* env vars or AWS Secrets Manager for those.

aws_region   = "us-east-1"
environment  = "prod"
vpc_cidr     = "10.0.0.0/16"

# ── Frontend ──────────────────────────────────────────────────────────────────
# Must be globally unique
frontend_bucket_name = "my-ecommerce-frontend-prod-2026"

# ── EC2 ───────────────────────────────────────────────────────────────────────
ec2_instance_type   = "t3.small"
key_pair_name       = "ecommerce-shop-key"
docker_hub_username = "dmuigo"
image_tag           = "latest"

# Set via env var:  export TF_VAR_allowed_origins="https://dxxxxxxx.cloudfront.net"
allowed_origins = ""

# ── RDS ───────────────────────────────────────────────────────────────────────
db_name           = "ecommerce"
db_username       = "admin"
db_instance_class = "db.t3.micro"

# Set via env var:  export TF_VAR_db_password="supersecret"
# db_password is now set via TF_VAR_db_password environment variable

# ── Secrets (always use env vars, never commit) ───────────────────────────────
# export TF_VAR_jwt_secret="your-jwt-secret"
# jwt_secret is now set via TF_VAR_jwt_secret environment variable

# ── CloudFront / TLS ──────────────────────────────────────────────────────────
# Optional: ACM cert ARN in us-east-1 for a custom domain.
# Leave blank to use the default *.cloudfront.net cert.
acm_certificate_arn = ""
