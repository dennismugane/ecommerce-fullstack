variable "environment" {}
variable "vpc_id" {}
variable "private_subnet_ids" {}
variable "ec2_security_group" {}
variable "db_name" {}
variable "db_username" {}
variable "db_password" { sensitive = true }
variable "db_instance_class" {}

# ── DB Subnet Group ───────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "ecommerce-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = { Name = "ecommerce-${var.environment}-db-subnet-group" }
}

# ── Security Group ────────────────────────────────────────────────────────────

resource "aws_security_group" "rds" {
  name        = "ecommerce-${var.environment}-rds-sg"
  description = "MySQL access from EC2 backend only"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.ec2_security_group]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ecommerce-${var.environment}-rds-sg" }
}

# ── Parameter Group ───────────────────────────────────────────────────────────

resource "aws_db_parameter_group" "mysql" {
  name   = "ecommerce-${var.environment}-mysql8"
  family = "mysql8.0"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  tags = { Name = "ecommerce-${var.environment}-mysql-params" }
}

# ── RDS Instance ──────────────────────────────────────────────────────────────

resource "aws_db_instance" "main" {
  identifier              = "ecommerce-${var.environment}-mysql"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.db_instance_class
  allocated_storage       = 20
  max_allocated_storage   = 100         # auto-scaling storage up to 100 GB
  storage_type            = "gp3"
  storage_encrypted       = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.mysql.name

  backup_retention_period  = 0
  backup_window            = "03:00-04:00"
  maintenance_window       = "sun:04:00-sun:05:00"
  deletion_protection      = false        # prevents accidental destroy
  skip_final_snapshot      = true
  final_snapshot_identifier = "ecommerce-${var.environment}-final"

  multi_az               = false         # set true for HA
  publicly_accessible    = false

  tags = { Name = "ecommerce-${var.environment}-rds" }
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "rds_endpoint" { value = aws_db_instance.main.endpoint }
output "rds_id"       { value = aws_db_instance.main.id }
