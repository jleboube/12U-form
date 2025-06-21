# Simple Production Setup with Nginx Proxy Manager

## Quick Setup (5 minutes)

### 1. Prepare Your Files
```bash
# Copy environment template and update values
cp .env.production .env
nano .env  # Change the passwords and domain

# Generate secure values if needed:
openssl rand -base64 32  # For DB_PASSWORD
openssl rand -base64 48  # For SESSION_SECRET
```

### 2. Point Your Domain to Server
Configure your DNS:
```
A    scouting-report.com        → YOUR_SERVER_IP
A    www.scouting-report.com    → YOUR_SERVER_IP
```

### 3. Start the Application
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check everything is running
docker-compose -f docker-compose.prod.yml ps
```

### 4. Configure Nginx Proxy Manager (Web UI)

#### Access the Admin Panel
- Open: `http://YOUR_SERVER_IP:81`
- **Default Login:**
  - Email: `admin@example.com`
  - Password: `changeme`
- **Change these credentials immediately!**

#### Add Your Domain
1. **Go to "Proxy Hosts"** → Click **"Add Proxy Host"**

2. **Details Tab:**
   - **Domain Names:** `scouting-report.com`, `www.scouting-report.com`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `app` (the Docker service name)
   - **Forward Port:** `3000`
   - ✅ **Cache Assets**
   - ✅ **Block Common Exploits**
   - ✅ **Websockets Support**

3. **SSL Tab:**
   - ✅ **SSL Certificate:** Request a new SSL Certificate
   - ✅ **Force SSL**
   - ✅ **HTTP/2 Support**
   - **Email:** Your email for Let's Encrypt
   - ✅ **I Agree to the Let's Encrypt Terms of Service**

4. **Click "Save"**

### 5. Test Your Site
- Visit: `https://scouting-report.com`
- Should redirect to HTTPS and show login page
- Login with: `admin@demo.com` / `admin123`

## That's It! 🎉

Your site is now running with:
- ✅ SSL Certificate (auto-renewed)
- ✅ HTTPS redirect
- ✅ Reverse proxy
- ✅ Security headers
- ✅ Professional setup

## Management Commands

### View Application Status
```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# View application logs
docker-compose -f docker-compose.prod.yml logs app

# View database logs
docker-compose -f docker-compose.prod.yml logs db
```

### Backup Database
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U scout_user baseball_scouting > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20241220.sql | docker-compose -f docker-compose.prod.yml exec -T db psql -U scout_user -d baseball_scouting
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up --build -d
```

### Restart Services
```bash
# Restart everything
docker-compose -f docker-compose.prod.yml restart

# Restart just the app
docker-compose -f docker-compose.prod.yml restart app
```

## Nginx Proxy Manager Features

### Access Control (Optional)
- Add **Access Lists** to restrict access by IP
- Set up **basic authentication** for extra security

### SSL Certificate Management
- Certificates auto-renew every 60 days
- View expiration dates in **SSL Certificates** tab
- Force renewal if needed

### Monitoring
- **View logs** in the web interface
- **Check certificate status**
- **Monitor proxy host health**

## Troubleshooting

### Site Not Loading
1. Check DNS propagation: `nslookup scouting-report.com`
2. Verify containers: `docker-compose -f docker-compose.prod.yml ps`
3. Check app logs: `docker-compose -f docker-compose.prod.yml logs app`

### SSL Issues
1. Check domain DNS points to your server
2. Verify port 80 and 443 are open
3. Try regenerating certificate in Nginx Proxy Manager

### Database Connection Issues
1. Check database logs: `docker-compose -f docker-compose.prod.yml logs db`
2. Verify environment variables in `.env`
3. Restart database: `docker-compose -f docker-compose.prod.yml restart db`

### Can't Access Admin Panel (Port 81)
```bash
# Check if port 81 is open on your server
sudo ufw allow 81

# Or use SSH tunnel if port is blocked
ssh -L 8081:localhost:81 user@your-server
# Then access http://localhost:8081
```

## Security Notes

1. **Change default admin credentials** in Nginx Proxy Manager immediately
2. **Use strong passwords** in your `.env` file
3. **Keep Docker images updated** regularly
4. **Monitor access logs** in Nginx Proxy Manager
5. **Consider adding access control** for admin areas

## File Structure
```
baseball-scouting-app/
├── docker-compose.prod.yml    # Main Docker setup
├── .env                       # Your environment variables
├── init.sql                   # Database schema
├── server.js                  # Application server
├── public/                    # Web files
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── backups/                   # Database backups (created automatically)
```

This setup is much simpler than traditional nginx configurations and provides all the same benefits through an easy web interface!