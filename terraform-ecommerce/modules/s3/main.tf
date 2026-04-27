variable "environment" {}
variable "frontend_bucket" {}
variable "cloudfront_oac_id" {}

# ── Frontend Bucket ───────────────────────────────────────────────────────────

resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket

  tags = { Name = "ecommerce-${var.environment}-frontend" }
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block ALL public access – CloudFront uses OAC instead
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# OAC bucket policy – grants CloudFront read access
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAC"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = var.cloudfront_oac_id
          }
        }
      }
    ]
  })
}

# ── Terraform State Bucket ────────────────────────────────────────────────────
# Pre-create this manually or via a bootstrap script BEFORE running the main plan.
# It is intentionally NOT managed by the state it backs up.

# ── Outputs ───────────────────────────────────────────────────────────────────

output "frontend_bucket_name"            { value = aws_s3_bucket.frontend.id }
output "frontend_bucket_arn"             { value = aws_s3_bucket.frontend.arn }
output "frontend_bucket_regional_domain" { value = aws_s3_bucket.frontend.bucket_regional_domain_name }
