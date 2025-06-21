#!/bin/bash

# Baseball Scouting App - Production Update Script
# Use this script to update the application in production

set -e

echo "🔄 Starting application update..."

# Create backup before update
echo "💾 Creating backup before update..."
./backup_database.sh

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull

# Check if .env file needs updates
if [ -f ".env.production.new" ]; then
    echo "⚠️  New environment variables detected. Please review:"
    diff .env .env.production.new || true
    echo ""
    read -p "Do you want to continue with the update? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Update cancelled."
        exit 0
    fi
fi

# Build and deploy updated containers
echo "🔨 Building updated containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Deploying updated containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to restart..."
sleep 30

# Health check
echo "🔍 Performing health check..."
if curl -f -s https://scouting-report.com > /dev/null; then
    echo "✅ Application is responding correctly"
else
    echo "❌ Application health check failed!"
    echo "📋 Recent logs:"
    docker-compose -f docker-compose.prod.yml logs --tail=50 app
    exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "✅ Update completed successfully!"
echo ""
echo "📋 Summary:"
echo "   🌐 Site: https://scouting-report.com"
echo "   💾 Backup: Created before update"
echo "   🔄 Status: All services running"
echo ""
echo "🔧 Quick commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Check status: docker-compose -f docker-compose.prod.yml ps"