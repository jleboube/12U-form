#!/bin/bash

# Baseball Scouting Database Restore Script
# Usage: ./restore_database.sh backup_file.sql.gz

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Example: $0 /path/to/baseball_scouting_backup_20250620_123456.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will replace ALL data in the database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Stopping application..."
docker-compose stop app

echo "Restoring database from: $BACKUP_FILE"

# Drop and recreate database
docker-compose exec db psql -U scout_user -c "DROP DATABASE IF EXISTS baseball_scouting;"
docker-compose exec db psql -U scout_user -c "CREATE DATABASE baseball_scouting;"

# Restore from backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker-compose exec -T db psql -U scout_user -d baseball_scouting
else
    cat "$BACKUP_FILE" | docker-compose exec -T db psql -U scout_user -d baseball_scouting
fi

echo "Starting application..."
docker-compose start app

echo "Database restore completed!"