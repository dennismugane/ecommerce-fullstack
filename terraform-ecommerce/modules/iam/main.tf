variable "environment" {}
variable "db_password_secret_arn" {}
variable "jwt_secret_arn" {}

# ── EC2 Instance Role ─────────────────────────────────────────────────────────

resource "aws_iam_role" "ec2" {
  name = "ecommerce-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# SSM Session Manager (replaces bastion host for debugging)
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch agent (optional but useful)
resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "ecommerce-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name
}

# Secrets Manager – least-privilege: only the two secrets this app needs
resource "aws_iam_role_policy" "secrets_read" {
  name = "ecommerce-${var.environment}-secrets-read"
  role = aws_iam_role.ec2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadAppSecrets"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          var.db_password_secret_arn,
          var.jwt_secret_arn
        ]
      }
    ]
  })
}

# ── Terraform State Resources ─────────────────────────────────────────────────
# These are created ONCE (bootstrap) and referenced by the S3 backend config.
# You can run this separately or use a local backend for the first apply.

resource "aws_s3_bucket" "tfstate" {
  bucket = "ecommerce-tfstate-prod"

  lifecycle {
    prevent_destroy = true
  }

  tags = { Name = "ecommerce-tfstate", Purpose = "terraform-state" }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tfstate_lock" {
  name         = "ecommerce-tfstate-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
  }

  tags = { Name = "ecommerce-tfstate-lock", Purpose = "terraform-state-lock" }
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "ec2_instance_profile_name" { value = aws_iam_instance_profile.ec2.name }
output "ec2_role_arn"              { value = aws_iam_role.ec2.arn }
