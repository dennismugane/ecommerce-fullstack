#!/bin/bash
set -euo pipefail
exec > >(tee /var/log/userdata.log | logger -t userdata) 2>&1

# ── System update & tooling ───────────────────────────────────────────────────
yum update -y
yum install -y docker aws-cli jq
systemctl enable --now docker
usermod -aG docker ec2-user

# ── Docker Compose v2 ─────────────────────────────────────────────────────────
curl -fsSL \
  "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# ── Fetch secrets from AWS Secrets Manager ────────────────────────────────────
# Fetched at boot via the instance IAM role. Values land only in a chmod-600
# .env file — never in the AMI, launch template, or Terraform state.

REGION=$(curl -sf http://169.254.169.254/latest/meta-data/placement/region)

echo "Fetching db_password from Secrets Manager..."
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id "${db_password_secret_name}" \
  --region "$REGION" \
  --query SecretString \
  --output text)

echo "Fetching jwt_secret from Secrets Manager..."
JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id "${jwt_secret_name}" \
  --region "$REGION" \
  --query SecretString \
  --output text)

# ── Write .env (600 permissions, root-owned) ──────────────────────────────────
mkdir -p /opt/ecommerce
cat > /opt/ecommerce/.env <<EOF
DOCKER_HUB_USERNAME=${docker_hub_username}
IMAGE_TAG=${image_tag}
RDS_ENDPOINT=${rds_endpoint}
MYSQL_DATABASE=${db_name}
MYSQL_USER=${db_username}
MYSQL_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
ALLOWED_ORIGINS=${allowed_origins}
EOF
chmod 600 /opt/ecommerce/.env

unset DB_PASSWORD JWT_SECRET   # clear from memory immediately

# ── docker-compose.yml ────────────────────────────────────────────────────────
cat > /opt/ecommerce/docker-compose.yml <<'COMPOSE'
services:
  java-backend:
    image: ${DOCKER_HUB_USERNAME}/ecommerce-backend:${IMAGE_TAG:-latest}
    container_name: ecommerce-backend
    restart: always
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_URL: jdbc:mysql://${RDS_ENDPOINT}:3306/${MYSQL_DATABASE}
      DB_USERNAME: ${MYSQL_USER}
      DB_PASSWORD: ${MYSQL_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    networks:
      - backend-network

networks:
  backend-network:
    driver: bridge
COMPOSE

# ── Reusable fetch script (runs on every reboot before Docker starts) ─────────
cat > /opt/ecommerce/fetch-secrets.sh <<FETCHSCRIPT
#!/bin/bash
set -euo pipefail
REGION=\$(curl -sf http://169.254.169.254/latest/meta-data/placement/region)
DB_PASSWORD=\$(aws secretsmanager get-secret-value \
  --secret-id "${db_password_secret_name}" \
  --region "\$REGION" \
  --query SecretString --output text)
JWT_SECRET=\$(aws secretsmanager get-secret-value \
  --secret-id "${jwt_secret_name}" \
  --region "\$REGION" \
  --query SecretString --output text)
sed -i "s|^MYSQL_PASSWORD=.*|MYSQL_PASSWORD=\$DB_PASSWORD|" /opt/ecommerce/.env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\$JWT_SECRET|" /opt/ecommerce/.env
unset DB_PASSWORD JWT_SECRET
FETCHSCRIPT
chmod 700 /opt/ecommerce/fetch-secrets.sh

# ── Systemd: fetch-secrets runs before ecommerce on every boot ───────────────
cat > /etc/systemd/system/ecommerce-secrets.service <<'SERVICE'
[Unit]
Description=Fetch ecommerce secrets from AWS Secrets Manager
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/opt/ecommerce/fetch-secrets.sh

[Install]
WantedBy=multi-user.target
SERVICE

cat > /etc/systemd/system/ecommerce.service <<'SERVICE'
[Unit]
Description=Ecommerce backend (Docker Compose)
Requires=docker.service ecommerce-secrets.service
After=docker.service ecommerce-secrets.service

[Service]
WorkingDirectory=/opt/ecommerce
ExecStart=/usr/local/bin/docker-compose --env-file .env up
ExecStop=/usr/local/bin/docker-compose --env-file .env down
Restart=always

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable ecommerce-secrets.service ecommerce.service

# ── Start now (first boot) ────────────────────────────────────────────────────
cd /opt/ecommerce
docker-compose --env-file .env up -d
