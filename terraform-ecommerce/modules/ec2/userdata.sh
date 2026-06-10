#!/bin/bash
exec > /var/log/userdata.log 2>&1
set -eo pipefail

echo "=== START USERDATA $(date) ==="

# ── Packages ──────────────────────────────────────────────────────────────────
dnf update -y
dnf install -y docker aws-cli jq git
echo "=== Packages installed ==="

# ── Docker ────────────────────────────────────────────────────────────────────
systemctl enable docker
systemctl start docker
sleep 15
systemctl is-active docker || { echo "=== FAILED: Docker not running"; exit 1; }
echo "=== Docker started ==="

usermod -aG docker ec2-user

# ── Docker Compose ────────────────────────────────────────────────────────────
curl -fsSL \
  "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
echo "=== Docker Compose installed ==="

# ── Secrets ───────────────────────────────────────────────────────────────────
REGION="us-east-1"
echo "=== Fetching secrets ==="

DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id "${db_password_secret_name}" \
  --region "$REGION" \
  --query SecretString \
  --output text) || { echo "=== FAILED: DB secret"; exit 1; }
echo "=== DB secret fetched OK ==="

JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id "${jwt_secret_name}" \
  --region "$REGION" \
  --query SecretString \
  --output text) || { echo "=== FAILED: JWT secret"; exit 1; }
echo "=== JWT secret fetched OK ==="

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p /opt/ecommerce

# ── Env file ──────────────────────────────────────────────────────────────────
cat > /opt/ecommerce/.env <<EOF
DOCKER_HUB_USERNAME=${docker_hub_username}
IMAGE_TAG=${image_tag}
RDS_ENDPOINT=${rds_endpoint}
MYSQL_DATABASE=${db_name}
MYSQL_USER=${db_username}
MYSQL_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
ALLOWED_ORIGINS=${allowed_origins}
DB_URL=jdbc:mysql://${rds_endpoint}/${db_name}?useSSL=false&allowPublicKeyRetrieval=true
DB_USERNAME=${db_username}
DB_PASSWORD=$DB_PASSWORD
SPRING_PROFILES_ACTIVE=prod
EOF
chmod 600 /opt/ecommerce/.env
unset DB_PASSWORD JWT_SECRET
echo "=== Env file created ==="

# ── Clone repo and use prod docker-compose ────────────────────────────────────
echo "=== Cloning repo ==="
git clone https://github.com/dennismugane/ecommerce-fullstack.git /tmp/ecommerce-repo \
  || { echo "=== FAILED: git clone"; exit 1; }

cp /tmp/ecommerce-repo/docker-compose.prod.yml /opt/ecommerce/docker-compose.yml
echo "=== docker-compose.prod.yml copied ==="

# ── fetch-secrets.sh ──────────────────────────────────────────────────────────
cat > /opt/ecommerce/fetch-secrets.sh <<FETCHSCRIPT
#!/bin/bash
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
sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=\$DB_PASSWORD|" /opt/ecommerce/.env
sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\$JWT_SECRET|" /opt/ecommerce/.env
unset DB_PASSWORD JWT_SECRET
echo "Secrets refreshed OK"
FETCHSCRIPT
chmod 700 /opt/ecommerce/fetch-secrets.sh
echo "=== fetch-secrets.sh created ==="

# ── Systemd services ──────────────────────────────────────────────────────────
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

# ── Pull image and start ──────────────────────────────────────────────────────
echo "=== Pulling Docker image ==="
cd /opt/ecommerce
docker pull ${docker_hub_username}/ecommerce-backend:${image_tag} \
  || { echo "=== FAILED: docker pull"; exit 1; }
echo "=== Image pulled ==="

/usr/local/bin/docker-compose --env-file /opt/ecommerce/.env up -d \
  || { echo "=== FAILED: docker-compose up"; exit 1; }
echo "=== Container started ==="

sleep 15
docker ps
echo "=== USERDATA COMPLETE $(date) ==="