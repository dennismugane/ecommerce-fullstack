variable "environment" {}
variable "db_password" { sensitive = true }
variable "jwt_secret"  { sensitive = true }

# ── DB Password ───────────────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "ecommerce/${var.environment}/db_password"
  description             = "RDS MySQL master password"
  recovery_window_in_days = 7

  tags = { Name = "ecommerce-${var.environment}-db-password" }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

# ── JWT Secret ────────────────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "ecommerce/${var.environment}/jwt_secret"
  description             = "Spring Boot JWT signing secret"
  recovery_window_in_days = 7

  tags = { Name = "ecommerce-${var.environment}-jwt-secret" }
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# ── Outputs (ARNs only — values never leave Secrets Manager) ──────────────────

output "db_password_secret_arn" { value = aws_secretsmanager_secret.db_password.arn }
output "jwt_secret_arn"         { value = aws_secretsmanager_secret.jwt_secret.arn }
output "db_password_secret_name" { value = aws_secretsmanager_secret.db_password.name }
output "jwt_secret_name"         { value = aws_secretsmanager_secret.jwt_secret.name }
