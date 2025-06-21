

## 🚀 **Deployment Steps**

### **1. Prepare Your VM**
```bash
# On your VM (Ubuntu 20.04+)
git clone <your-repo> baseball-scouting-app
cd baseball-scouting-app
```

### **2. Configure Environment**
```bash
# Copy and edit environment file
cp .env.production .env
nano .env  # Add your secure passwords and domain info
```

### **3. Update Deployment Script**
```bash
# Edit deploy.sh to add your email for SSL certificates
nano deploy.sh  # Change EMAIL="your-email@example.com"
```

### **4. Run Deployment**
```bash
# Make executable and deploy
chmod +x deploy.sh
chmod +x update.sh
chmod +x health_check.sh
./deploy.sh
```

### **5. Configure DNS**
Point your domain DNS to your VM's IP:
```
A    scouting-report.com        → YOUR_VM_IP
A    www.scouting-report.com    → YOUR_VM_IP
```

## 🔍 **What the Deploy Script Does**

1. **System Setup**: Installs Docker, configures firewall, enables fail2ban
2. **SSL Certificate**: Automatically gets Let's Encrypt certificate for your domain
3. **Security**: Configures UFW firewall and fail2ban intrusion detection
4. **Application**: Builds and starts your app with production settings
5. **Automation**: Sets up daily backups and SSL renewal

## 📋 **Post-Deployment Checklist**

### **Immediate (First 24 hours):**
- [ ] Test site access: `https://scouting-report.com`
- [ ] Login with demo account: `admin@demo.com` / `admin123`
- [ ] Create your first team account
- [ ] Test scouting report creation
- [ ] Run health check: `./health_check.sh`

### **Within First Week:**
- [ ] Create user management process
- [ ] Test backup/restore: `./backup_database.sh`
- [ ] Monitor logs: `docker-compose -f docker-compose.prod.yml logs`
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`

## 🛠️ **Ongoing Maintenance**

### **Daily:**
```bash
# Quick health check
./health_check.sh
```

### **Weekly:**
```bash
# Update application
git pull
./update.sh
```

### **Monthly:**
```bash
# Test backup restore
./restore_database.sh <backup_file>
```

## 🚨 **Important Security Notes**

1. **Change default passwords** immediately after deployment
2. **Keep your VM updated** with security patches
3. **Monitor the logs** regularly for suspicious activity
4. **Test your backups** - ensure you can restore data
5. **Monitor SSL certificate** expiry (auto-renewed but check status)

## 🆘 **Support & Troubleshooting**

- **Application logs**: `docker-compose -f docker-compose.prod.yml logs app`
- **Nginx logs**: `docker-compose -f docker-compose.prod.yml logs nginx`
- **Database logs**: `docker-compose -f docker-compose.prod.yml logs db`
- **System health**: `./health_check.sh`
- **Service status**: `docker-compose -f docker-compose.prod.yml ps`
