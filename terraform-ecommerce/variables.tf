variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# ── Frontend ───────────────────────────────────────────────────────────────────

variable "frontend_bucket_name" {
  description = "Globally unique S3 bucket name for the React/Vite frontend"
  type        = string
}

# ── EC2 / Backend ──────────────────────────────────────────────────────────────

variable "ec2_instance_type" {
  description = "EC2 instance type for the backend"
  type        = string
  default     = "t3.small"
}

variable "key_pair_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
}

variable "docker_hub_username" {
  description = "Docker Hub username used in the image tag"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy (e.g. latest or a git SHA)"
  type        = string
  default     = "latest"
}

variable "allowed_origins" {
  description = "CORS allowed origins (your CloudFront / custom domain URL)"
  type        = string
}

variable "jwt_secret" {
  description = "JWT signing secret – supply via TF_VAR_jwt_secret or secrets manager"
  type        = string
  sensitive   = true
}

# ── RDS ───────────────────────────────────────────────────────────────────────

variable "db_name" {
  description = "MySQL database name"
  type        = string
  default     = "ecommerce"
}

variable "db_username" {
  description = "MySQL master username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "MySQL master password – supply via TF_VAR_db_password or secrets manager"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ── CloudFront / TLS ──────────────────────────────────────────────────────────

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (must be in us-east-1 for CloudFront)"
  type        = string
  default     = ""   # leave blank to use CloudFront default cert
}
