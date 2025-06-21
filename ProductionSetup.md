# Production Deployment Guide - scouting-report.com

## Prerequisites

### 1. Domain Setup
- **Register domain**: `scouting-report.com`
- **DNS Configuration**: Point A records to your VM's IP address:
  ```
  A    scouting-report.com        → YOUR_VM_IP
  A    www.scouting-report.com    → YOUR_VM_IP
  ```

### 2. VM Requirements
- **OS**: Ubuntu 20.04+ or similar
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: Minimum 20GB
- **Ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 3. Initial VM Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Create application user
sudo adduser scoutingapp
sudo usermod -aG sudo scoutingapp
su - scoutingapp

# Clone your application
git clone <your-repo-url> baseball-scouting-app
cd baseball-scouting-app
```

## Deployment Steps

### Step 1: Environment Configuration
```bash
# Copy environment template
cp .env.production .env

# Edit with your secure values
nano .env
```

**Required values to update in `.env`:**
- `DB_PASSWORD`: Strong database password (20+ characters)
- `SESSION_SECRET`: Strong session secret (32+ characters)  
- `EMAIL`: Your email for SSL certificates

**Generate secure values:**
```bash
# Generate strong password
openssl rand -base64 32

# Generate session secret  
openssl rand -base64 48
```

### Step 2: Deploy Application
```bash
# Make deployment script executable
chmod +x deploy.sh

# Edit deploy.sh to update your email
nano deploy.sh  # Change EMAIL="your-email@example.com"

# Run deployment
./deploy.sh
```

### Step 3: DNS Verification
```bash
# Check if DNS has propagated
nslookup scouting-report.com
nslookup www.scouting-report.com

# Test HTTP redirect (should redirect to HTTPS)
curl -I http://scouting-report.com

# Test HTTPS (should return 200 OK)
curl -I https://scouting-report.com
```

## Security Configuration

### Firewall Status
```bash
# Check firewall status
sudo ufw status

# Should show:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere  
# 443/tcp                    ALLOW       Anywhere
```

### SSL Certificate
```bash
# Check certificate expiration
sudo docker-compose -f docker-compose.prod.yml exec certbot certbot certificates

# Manual renewal (automatic renewal is configured)
sudo docker-compose -f docker-compose.prod.yml exec certbot certbot renew
```

### Fail2ban Protection
```bash
# Check fail2ban status
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status sshd
sudo fail2ban-client status nginx-http-auth
```

## Application Management

### Service Management
```bash
# View running containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs
docker-compose -f docker-compose.prod.yml logs app
docker-compose -f docker-compose.prod.yml logs nginx

# Restart services
docker-compose -f docker-compose.prod.yml restart
docker-compose -f docker-compose.prod.yml restart app

# Update application
git pull
docker-compose -f docker-compose.prod.yml up --build -d
```

### Database Management
```bash
# Create backup
./backup_database.sh

# View backups
ls -la ~/baseball-scouting-backups/

# Restore from backup
./restore_database.sh ~/baseball-scouting-backups/backup_file.sql.gz

# Connect to database
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting
```

### Monitoring
```bash
# Check system resources
htop
df -h
free -h

# Check docker resources
docker stats

# Check nginx access logs
docker-compose -f docker-compose.prod.yml logs nginx | tail -100

# Check application logs
docker-compose -f docker-compose.prod.yml logs app | tail -100
```

## First-Time Setup After Deployment

### 1. Access the Application
- Navigate to: `https://scouting-report.com`
- You should see the login page

### 2. Login with Demo Account
- **Email**: `admin@demo.com`
- **Password**: `admin123`

### 3. Immediate Security Tasks
1. **Change admin password** (create user management feature)
2. **Create your team accounts**
3. **Test scouting report creation**
4. **Test backup/restore process**

## Maintenance Tasks

### Daily
- Check application accessibility
- Monitor disk space: `df -h`

### Weekly
- Review logs for errors
- Check backup integrity
- Update system packages: `sudo apt update && sudo apt upgrade`

### Monthly
- Review SSL certificate status
- Test backup restore process
- Review fail2ban logs
- Update Docker images

## Troubleshooting

### SSL Issues
```bash
# Check certificate files
sudo ls -la /etc/letsencrypt/live/scouting-report.com/

# Regenerate certificate
docker-compose -f docker-compose.prod.yml stop nginx
docker run --rm -v $(pwd)/certbot/conf:/etc/letsencrypt -v $(pwd)/certbot/www:/var/www/certbot certbot/certbot renew --force-renewal
docker-compose -f docker-compose.prod.yml start nginx
```

### Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml logs db

# Reset database password
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -c "ALTER USER scout_user PASSWORD 'new_password';"
```

### Application Issues
```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs app

# Restart application only
docker-compose -f docker-compose.prod.yml restart app

# Rebuild application
docker-compose -f docker-compose.prod.yml up --build -d app
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Check system load
uptime
iostat

# Optimize database
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "VACUUM ANALYZE;"
```

## Backup Strategy

### Automated Backups
- **Daily SQL dumps**: 2 AM via cron
- **Location**: `~/baseball-scouting-backups/`
- **Retention**: 30 days

### Manual Backup
```bash
# Create immediate backup
./backup_database.sh

# Backup to external location
rsync -av ~/baseball-scouting-backups/ /mnt/external-backup/
```

### Disaster Recovery
1. **New VM Setup**: Deploy on fresh VM
2. **Restore Database**: Use latest backup
3. **Update DNS**: Point domain to new IP
4. **SSL**: Certificates restore automatically

## Performance Optimization

### For High Traffic
```yaml
# In docker-compose.prod.yml, add:
services:
  app:
    deploy:
      replicas: 2
    
  nginx:
    # Add load balancing
```

### Database Optimization
```sql
-- Connect to database and run:
CREATE INDEX IF NOT EXISTS idx_reports_date ON scouting_reports(scout_date);
CREATE INDEX IF NOT EXISTS idx_reports_team ON scouting_reports(team);
VACUUM ANALYZE;
```

## Support Contacts
- **System Admin**: [Your contact]
- **Database Backup**: `~/baseball-scouting-backups/`
- **SSL Certificate**: Auto-renewed
- **Domain**: scouting-report.com
- **Server IP**: [Your VM IP]

---

## Quick Reference Commands

```bash
# Application status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Backup database
./backup_database.sh

# Update application
git pull && docker-compose -f docker-compose.prod.yml up --build -d

# Check SSL certificate
curl -I https://scouting-report.com

# System monitoring
htop
df -h
```