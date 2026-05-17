#!/bin/bash
set -eo pipefail
exec > /var/log/userdata.log 2>&1

echo "=== START USERDATA $(date) ==="

# FIXED: Using AL2023 native dnf package engine
dnf update -y
dnf install -y docker aws-cli jq
echo "=== Packages installed ==="

systemctl enable docker
systemctl start docker
sleep 10
echo "=== Docker started ==="

usermod -aG docker ec2-user

curl -fsSL \
  "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
echo "=== Docker Compose installed ==="

REGION="us-east-1"
echo "=== Region: $REGION ==="

echo "=== Fetching secrets ==="
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id "${db_password_secret_name}" \
  --region "$REGION" \
  --query SecretString \
  --output text)
echo "=== DB secret fetched: $${#DB_PASSWORD} chars ==="

JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id "${jwt_secret_name}" \
  --region "$REGION" \
  --query SecretString \
  --output text)
echo "=== JWT secret fetched: $${#JWT_SECRET} chars ==="

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
unset DB_PASSWORD JWT_SECRET
echo "=== Env file created ==="

cat > /opt/ecommerce/docker-compose.yml <<COMPOSE
services:
  java-backend:
    image: ${docker_hub_username}/ecommerce-backend:${image_tag}
    container_name: ecommerce-backend
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - /opt/ecommerce/.env
    environment:
      SPRING_PROFILES_ACTIVE: prod
      DB_URL: jdbc:mysql://${rds_endpoint}/${db_name}?useSSL=false&allowPublicKeyRetrieval=true
      DB_USERNAME: ${db_username}
      DB_PASSWORD: $${MYSQL_PASSWORD}
      JWT_SECRET: $${JWT_SECRET}
      ALLOWED_ORIGINS: ${allowed_origins}
    networks:
      - backend-network

networks:
  backend-network:
    driver: bridge
COMPOSE
echo "=== Docker compose file created ==="

cat > /opt/ecommerce/fetch-secrets.sh <<FETCHSCRIPT
#!/bin/bash
set -eo pipefail
REGION="us-east-1"
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
echo "=== fetch-secrets.sh created ==="

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
ExecStart=/usr/local/bin/docker-compose --env-file /opt/ecommerce/.env up
ExecStop=/usr/local/bin/docker-compose --env-file /opt/ecommerce/.env down
Restart=always
RestartSec=10
[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable ecommerce-secrets.service ecommerce.service
echo "=== Systemd services registered ==="

echo "=== Pulling Docker image ==="
cd /opt/ecommerce
docker pull ${docker_hub_username}/ecommerce-backend:${image_tag}
echo "=== Image pulled ==="

# FIXED: Using explicit full system binary paths
/usr/local/bin/docker-compose --env-file /opt/ecommerce/.env up -d
echo "=== Container started ==="

sleep 10
docker ps
echo "=== USERDATA COMPLETE $(date) ==="