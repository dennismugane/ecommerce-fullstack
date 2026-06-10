terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state: S3 bucket + DynamoDB lock table
  backend "s3" {
    bucket         = "muganed-terraform-state-dev-2026"        # must exist before first init
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "ecommerce-tfstate-lock"        # must exist before first init
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ecommerce"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# ── Modules ────────────────────────────────────────────────────────────────────

module "vpc" {
  source      = "./modules/vpc"
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

module "secrets" {
  source      = "./modules/secrets"
  environment = var.environment
  db_password = var.db_password
  jwt_secret  = var.jwt_secret
}

module "iam" {
  source                 = "./modules/iam"
  environment            = var.environment
  db_password_secret_arn = module.secrets.db_password_secret_arn
  jwt_secret_arn         = module.secrets.jwt_secret_arn
}

module "s3" {
  source              = "./modules/s3"
  environment         = var.environment
  frontend_bucket     = var.frontend_bucket_name
  cloudfront_oac_id   = module.cloudfront.oac_id
  cloudfront_distribution_arn = module.cloudfront.frontend_distribution_arn
}

module "rds" {
  source              = "./modules/rds"
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  ec2_security_group  = module.ec2.backend_sg_id
  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = var.db_password
  db_instance_class   = var.db_instance_class
}

module "ec2" {
  source                  = "./modules/ec2"
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  public_subnet_ids       = module.vpc.public_subnet_ids
  instance_type           = var.ec2_instance_type
  key_name                = var.key_pair_name
  iam_instance_profile    = module.iam.ec2_instance_profile_name
  rds_endpoint            = module.rds.rds_endpoint
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password_secret_name = module.secrets.db_password_secret_name
  jwt_secret_name         = module.secrets.jwt_secret_name
  allowed_origins         = var.allowed_origins
  docker_hub_username     = var.docker_hub_username
  image_tag               = var.image_tag
}

module "cloudfront" {
  source               = "./modules/cloudfront"
  environment          = var.environment
  frontend_bucket_name = module.s3.frontend_bucket_name
  frontend_bucket_domain = module.s3.frontend_bucket_regional_domain
  backend_alb_dns      = module.ec2.alb_dns_name
  acm_certificate_arn  = var.acm_certificate_arn
}

module "eks" {
  source             = "./modules/eks"
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
}
