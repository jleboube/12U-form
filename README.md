# Baseball Scouting Reports Web App

A comprehensive web application for creating, managing, and storing baseball scouting reports for 12U players. Built with Node.js, Express, PostgreSQL, and vanilla JavaScript with a smooth, modern user interface.

## Features

- ✅ **Complete Scouting Form** - All fields from the 12U template
- ✅ **Database Storage** - PostgreSQL with full CRUD operations
- ✅ **Search & Filter** - Find reports by player name, team, or position
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **Auto-save Drafts** - Never lose your work
- ✅ **Smooth Animations** - Modern, satisfying user experience
- ✅ **Docker Compose** - Easy setup and deployment

## Quick Start

### Prerequisites
- Docker and Docker Compose installed on your system

### Installation

1. **Clone or create the project directory:**
```bash
mkdir baseball-scouting-app
cd baseball-scouting-app
```

2. **Create all the files** (copy the provided code into these files):
   - `docker-compose.yml`
   - `Dockerfile`
   - `package.json`
   - `server.js`
   - `init.sql`
   - `public/index.html`
   - `public/styles.css`
   - `public/app.js`

3. **Create the public directory:**
```bash
mkdir public
```

4. **Start the application:**
```bash
docker-compose up -d
```

5. **Access the application:**
   - Open your browser to `http://localhost:3000`
   - The database will be automatically initialized on first run

## Usage

### Creating a New Report
1. Click the "**+ New Report**" button
2. Fill out the comprehensive scouting form
3. Click "**Save Report**" to store in the database
4. The form auto-saves drafts every 30 seconds

### Managing Reports
- **View All Reports**: The main dashboard shows all scouting reports
- **Search**: Use the search bar to find specific players
- **Edit**: Click any report card to edit
- **Delete**: Use the delete button when editing a report

### Form Sections
The scouting form includes all areas from the 12U template:

- **Scout Information** - Date, event, league details
- **Player Information** - Name, position, physical details
- **Physical Development** - Build, coordination, athleticism
- **Hitting Fundamentals** - Stance, mechanics, power potential
- **Running & Base Running** - Speed, stealing ability, base IQ
- **Fielding Skills** - Glove work, arm strength, range
- **Pitching** - Velocity, control, pitch development
- **Baseball IQ & Intangibles** - Coachability, competitiveness
- **Development Areas** - Strengths and improvement areas
- **Projections** - Current level and potential
- **Notes & Observations** - Additional comments

## Development

### Local Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Access
- **Host**: localhost
- **Port**: 5432
- **Database**: baseball_scouting
- **Username**: scout_user
- **Password**: scout_pass

### API Endpoints
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get specific report
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

## File Structure
```
baseball-scouting-app/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── server.js
├── init.sql
├── README.md
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Technical Details

### Backend
- **Node.js** with Express framework
- **PostgreSQL** database with comprehensive schema
- **RESTful API** design
- **CORS** enabled for development
- **Environment variables** for configuration

### Frontend
- **Vanilla JavaScript** for optimal performance
- **CSS Grid & Flexbox** for responsive layouts
- **Modern gradients** and animations
- **Mobile-first** responsive design
- **Local storage** for draft auto-save

### Database Schema
The PostgreSQL database includes a comprehensive table with 65+ fields covering all aspects of player evaluation, including timestamps for created/updated tracking.

## Customization

### Adding New Fields
1. Update the database schema in `init.sql`
2. Add the field to the HTML form in `index.html`
3. Update the server-side API in `server.js`
4. Add any necessary styling in `styles.css`

### Styling Changes
The app uses CSS custom properties and can be easily themed by modifying the gradient colors and design variables in `styles.css`.

## Deployment

### Production Deployment
1. Update environment variables in `docker-compose.yml`
2. Configure proper PostgreSQL credentials
3. Set up reverse proxy (nginx) if needed
4. Enable SSL/HTTPS for production use

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)
- `PORT` - Application port (default: 3000)

## Support

For issues or questions:
1. Check the browser console for JavaScript errors
2. Check Docker logs: `docker-compose logs`
3. Verify database connection and schema
4. Ensure all files are in correct locations

## License

This project is designed for baseball coaching and scouting use. Feel free to modify and adapt for your specific needs.