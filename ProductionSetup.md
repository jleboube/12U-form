# Simple Team Registration with Codes

## Quick Setup

### 1. Configure Environment
```bash
cp .env.production .env
nano .env  # Update passwords and domain
```

### 2. Deploy
```bash
chmod +x *.sh
./deploy.sh
```

### 3. Configure Domain & SSL
- Access Nginx Proxy Manager: `http://YOUR_IP:81`
- Login: `admin@example.com` / `changeme` (change immediately!)
- Add proxy host for your domain pointing to `app:3000`
- Request SSL certificate

### 4. Test Registration
Visit your site and try registering with these team codes:
- **Demo Team**: Use code `DEMO2024`
- **Lions Baseball**: Use code `LIONS2024`  
- **Eagles Baseball**: Use code `EAGLES2024`

## How Team Registration Works

### Registration Process
1. User selects a team from dropdown
2. User enters the team's registration code
3. Code is validated against the database
4. If valid, user is registered and can access team's scouting reports
5. If invalid, registration is rejected

### Team Codes
Each team has a unique registration code:
- **Demo Team**: `DEMO2024`
- **Lions Baseball**: `LIONS2024`
- **Eagles Baseball**: `EAGLES2024`

### Security
- Users can only see scouting reports from their own team
- Registration codes prevent unauthorized team access
- No admin approval needed - just the correct code

## Managing Teams

### View Current Teams
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "SELECT id, name, registration_code FROM groups;"
```

### Add New Team
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "INSERT INTO groups (name, description, registration_code) VALUES ('Team Name', 'Description', 'TEAMCODE2024');"
```

### Change Team Code
```bash
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "UPDATE groups SET registration_code = 'NEWCODE2024' WHERE name = 'Team Name';"
```

## Testing

### Test with Demo Account
- Login: `admin@demo.com` / `admin123`
- This account is already registered to Demo Team

### Test Registration
1. Go to registration page
2. Fill out form
3. Select "Demo Team"
4. Enter code: `DEMO2024`
5. Should register successfully

## Management Commands

### View Application Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs app
```

### Backup Database
```bash
./backup_database.sh
```

### Update Application
```bash
./update.sh
```

## File Structure
```
baseball-scouting-app/
├── docker-compose.prod.yml    # Production setup
├── .env                       # Your configuration
├── server.js                  # Application with team code validation
├── init.sql                   # Database with teams and codes
└── public/                    # Web interface with registration form
```

## Troubleshooting

### Teams not loading in dropdown?
```bash
# Check database connection
docker-compose -f docker-compose.prod.yml logs app

# Verify teams exist
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "SELECT * FROM groups;"
```

### Registration failing?
- Check that team code exactly matches (case sensitive)
- Verify team exists in database
- Check application logs for errors

### Can't see other team's reports?
- This is correct! Users can only see their own team's reports
- Each user is isolated to their registered team

This simple system provides team security through registration codes without complex admin panels or approval workflows.