#!/bin/bash

# Baseball Scouting App - Production Deployment Script
# For scouting-report.com

set -e

echo "🚀 Starting production deployment for scouting-report.com..."

# Configuration
DOMAIN="scouting-report.com"
EMAIL="your-email@example.com"  # Update this with your email for Let's Encrypt

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Please run as a regular user with sudo access."
   exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it from .env.production template"
    echo "   cp .env.production .env"
    echo "   nano .env  # Update with your secure values"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
if [ -z "$DB_PASSWORD" ] || [ -z "$SESSION_SECRET" ]; then
    echo "❌ Missing required environment variables. Please check your .env file."
    exit 1
fi

echo "✅ Environment variables validated"

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p nginx
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p backups

# Install Docker and Docker Compose if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required system packages
echo "📦 Installing required packages..."
sudo apt install -y ufw fail2ban

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Configure fail2ban for additional security
echo "🔒 Configuring fail2ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

# Generate SSL certificate with dry run first
echo "🔐 Setting up SSL certificate..."
echo "First, let's do a dry run to test the certificate generation..."

# Create initial nginx config for certificate generation
cat > nginx/nginx.conf.temp << EOF
events {}
http {
    server {
        listen 80;
        server_name $DOMAIN www.$DOMAIN;
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        location / {
            return 301 https://\$server_name\$request_uri;
        }
    }
}
EOF

# Start nginx with temporary config for certificate generation
docker run --rm -d --name nginx-temp \
  -p 80:80 \
  -v $(pwd)/nginx/nginx.conf.temp:/etc/nginx/nginx.conf \
  -v $(pwd)/certbot/www:/var/www/certbot \
  nginx:alpine

# Generate certificate (dry run first)
echo "Testing certificate generation..."
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email $EMAIL --agree-tos --no-eff-email --dry-run \
  -d $DOMAIN -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ Dry run successful! Generating real certificate..."
    docker run --rm \
      -v $(pwd)/certbot/conf:/etc/letsencrypt \
      -v $(pwd)/certbot/www:/var/www/certbot \
      certbot/certbot certonly --webroot --webroot-path=/var/www/certbot \
      --email $EMAIL --agree-tos --no-eff-email \
      -d $DOMAIN -d www.$DOMAIN
else
    echo "❌ Certificate dry run failed. Please check your domain DNS settings."
    docker stop nginx-temp || true
    exit 1
fi

# Stop temporary nginx
docker stop nginx-temp || true

# Copy the production nginx config
if [ -f "nginx/nginx.conf" ]; then
    echo "✅ Using existing nginx configuration"
else
    echo "❌ nginx/nginx.conf not found. Please ensure you have the nginx configuration file."
    exit 1
fi

# Build and start the application
echo "🚀 Building and starting the application..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services are running!"
else
    echo "❌ Some services failed to start. Checking logs..."
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Set up automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/local/bin/docker-compose -f $(pwd)/docker-compose.prod.yml exec certbot certbot renew --quiet && /usr/local/bin/docker-compose -f $(pwd)/docker-compose.prod.yml restart nginx") | crontab -

# Set up automatic backups
echo "💾 Setting up automatic backups..."
chmod +x backup_database.sh
(crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/backup_database.sh") | crontab -

# Final status check
echo "🔍 Final status check..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Summary:"
echo "   🌐 Domain: https://$DOMAIN"
echo "   🔒 SSL Certificate: ✅ Installed"
echo "   🔥 Firewall: ✅ Configured"
echo "   🛡️  Fail2ban: ✅ Active"
echo "   💾 Backups: ✅ Scheduled daily at 2 AM"
echo "   🔄 SSL Renewal: ✅ Automated"
echo ""
echo "📝 Next steps:"
echo "   1. Point your domain DNS to this server's IP address"
echo "   2. Wait for DNS propagation (can take up to 24 hours)"
echo "   3. Test the site at https://$DOMAIN"
echo "   4. Log in with the demo account: admin@demo.com / admin123"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   Backup: ./backup_database.sh"
echo "   Update: git pull && docker-compose -f docker-compose.prod.yml up --build -d"
echo ""
echo "⚠️  Security reminder:"
echo "   - Change the default admin password immediately"
echo "   - Keep your server updated"
echo "   - Monitor the logs regularly"