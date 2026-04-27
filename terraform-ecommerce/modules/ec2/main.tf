variable "environment" {}
variable "vpc_id" {}
variable "public_subnet_ids" {}
variable "instance_type" {}
variable "key_name" {}
variable "iam_instance_profile" {}
variable "rds_endpoint" {}
variable "db_name" {}
variable "db_username" {}
variable "db_password_secret_name" {}   # Secrets Manager secret name, not the value
variable "jwt_secret_name" {}           # Secrets Manager secret name, not the value
variable "allowed_origins" {}
variable "docker_hub_username" {}
variable "image_tag" {}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# ── Security Groups ───────────────────────────────────────────────────────────

resource "aws_security_group" "alb" {
  name        = "ecommerce-${var.environment}-alb-sg"
  description = "Allow HTTPS/HTTP from anywhere (CloudFront forwards here)"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ecommerce-${var.environment}-alb-sg" }
}

resource "aws_security_group" "backend" {
  name        = "ecommerce-${var.environment}-backend-sg"
  description = "Allow port 8080 from ALB only"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]   # tighten to your IP in production
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "ecommerce-${var.environment}-backend-sg" }
}

# ── Application Load Balancer ─────────────────────────────────────────────────

resource "aws_lb" "backend" {
  name               = "ecommerce-${var.environment}-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = { Name = "ecommerce-${var.environment}-alb" }
}

resource "aws_lb_target_group" "backend" {
  name        = "ecommerce-${var.environment}-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/actuator/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = { Name = "ecommerce-${var.environment}-tg" }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.backend.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ── Launch Template + ASG ─────────────────────────────────────────────────────

resource "aws_launch_template" "backend" {
  name_prefix   = "ecommerce-${var.environment}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type
  key_name      = var.key_name

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  vpc_security_group_ids = [aws_security_group.backend.id]

  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    rds_endpoint            = var.rds_endpoint
    db_name                 = var.db_name
    db_username             = var.db_username
    db_password_secret_name = var.db_password_secret_name
    jwt_secret_name         = var.jwt_secret_name
    allowed_origins         = var.allowed_origins
    docker_hub_username     = var.docker_hub_username
    image_tag               = var.image_tag
  }))

  tag_specifications {
    resource_type = "instance"
    tags = { Name = "ecommerce-${var.environment}-backend" }
  }
}

resource "aws_autoscaling_group" "backend" {
  name                = "ecommerce-${var.environment}-asg"
  desired_capacity    = 1
  min_size            = 1
  max_size            = 3
  vpc_zone_identifier = var.public_subnet_ids
  target_group_arns   = [aws_lb_target_group.backend.arn]
  health_check_type   = "ELB"

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "ecommerce-${var.environment}-backend"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ── CPU-based auto-scaling policy ─────────────────────────────────────────────

resource "aws_autoscaling_policy" "scale_out" {
  name                   = "ecommerce-${var.environment}-scale-out"
  autoscaling_group_name = aws_autoscaling_group.backend.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "alb_dns_name"    { value = aws_lb.backend.dns_name }
output "backend_sg_id"   { value = aws_security_group.backend.id }
