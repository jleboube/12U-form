#!/bin/bash

# Debug script to check environment variables and database connectivity

echo "🔍 Environment Variables Debug"
echo "=============================="

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "📋 Contents:"
    cat .env
    echo ""
else
    echo "❌ .env file not found!"
    echo "📝 Please create .env file:"
    echo "   cp .env.production .env"
    echo "   nano .env"
    exit 1
fi

echo "🐳 Docker Environment Variables"
echo "==============================="
echo "Checking what the app container sees:"
docker-compose -f docker-compose.prod.yml exec app printenv | grep -E "(DB_|NODE_|SESSION_|DOMAIN)" || echo "❌ Container not running or no env vars found"

echo ""
echo "🗄️  Database Connection Test"
echo "============================="
echo "Testing database connectivity:"

# Test database connection
if docker-compose -f docker-compose.prod.yml exec db pg_isready -U scout_user -h localhost; then
    echo "✅ Database is ready"
    
    # Check if tables exist
    echo "📊 Checking database tables:"
    docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "\dt" 2>/dev/null || echo "❌ Could not connect to database"
    
    # Check groups table specifically
    echo "👥 Checking groups table:"
    docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "SELECT id, name, registration_code FROM groups;" 2>/dev/null || echo "❌ Groups table not found or empty"
    
else
    echo "❌ Database is not ready"
fi

echo ""
echo "📱 Application Logs"
echo "==================="
echo "Recent application logs:"
docker-compose -f docker-compose.prod.yml logs app --tail=20