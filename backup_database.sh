#!/bin/bash

# Baseball Scouting Database Backup Script
# Run this script regularly to backup your database

# Configuration
BACKUP_DIR="/home/$(whoami)/baseball-scouting-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="baseball_scouting_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create database backup
echo "Creating database backup..."
docker-compose exec -T db pg_dump -U scout_user -d baseball_scouting > "$BACKUP_DIR/$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

echo "Backup created: $BACKUP_DIR/${BACKUP_FILE}.gz"

# Keep only last 30 backups (optional)
find "$BACKUP_DIR" -name "baseball_scouting_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed successfully!"
echo "Location: $BACKUP_DIR/${BACKUP_FILE}.gz"