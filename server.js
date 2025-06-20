const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://scout_user:scout_pass@localhost:5432/baseball_scouting'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Define all database columns in the exact order they appear in init.sql
const DB_FIELDS = [
    'scout_name', 'scout_date', 'event', 'league_organization',
    'player_name', 'primary_position', 'jersey_number', 'date_of_birth', 
    'age', 'height', 'weight', 'bats', 'throws', 'team', 'parent_guardian', 
    'contact', 'build', 'coordination', 'athleticism', 'motor_skills', 
    'growth_projection', 'stance_setup', 'swing_mechanics', 'contact_ability', 
    'power_potential', 'plate_discipline', 'bat_speed', 'approach', 'bunting',
    'speed', 'base_running_iq', 'stealing_ability', 'first_step', 'turns',
    'fielding_readiness', 'glove_work', 'footwork', 'arm_strength', 
    'arm_accuracy', 'range_field', 'game_awareness', 'positions_played',
    'fastball_mph', 'control_pitching', 'breaking_ball', 'changeup', 
    'delivery', 'mound_presence', 'strikes', 'game_understanding', 
    'coachability', 'effort_level', 'competitiveness', 'teamwork',
    'focus_attention', 'leadership', 'biggest_strengths', 'improvement_areas',
    'recommended_focus', 'current_level', 'development_potential', 
    'recommended_next_steps', 'playing_time_recommendation', 'position_projection',
    'additional_training', 'work_at_home', 'positive_reinforcement',
    'notes_observations', 'next_evaluation_date', 'followup_items'
];

// Routes

// Get all scouting reports
app.get('/api/reports', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, player_name, primary_position, team, scout_date, created_at FROM scouting_reports ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Get single scouting report
app.get('/api/reports/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM scouting_reports WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

// Create new scouting report
app.post('/api/reports', async (req, res) => {
    const data = req.body;
    
    try {
        console.log('Creating report with fields:', DB_FIELDS.length);
        
        // Create placeholders for the query
        const placeholders = DB_FIELDS.map((_, index) => `$${index + 1}`).join(', ');
        
        // Create the query
        const query = `
            INSERT INTO scouting_reports (${DB_FIELDS.join(', ')}) 
            VALUES (${placeholders}) 
            RETURNING id
        `;
        
        // Extract values in the correct order, using null for missing fields
        const values = DB_FIELDS.map(field => {
            const value = data[field];
            // Convert empty strings to null for database
            return (value !== undefined && value !== '') ? value : null;
        });
        
        console.log('Query has', DB_FIELDS.length, 'columns and', values.length, 'values');
        
        const result = await pool.query(query, values);
        res.json({ id: result.rows[0].id, message: 'Report created successfully' });
        
    } catch (err) {
        console.error('Database error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ 
            error: 'Failed to create report', 
            details: err.message 
        });
    }
});

// Update scouting report
app.put('/api/reports/:id', async (req, res) => {
    const data = req.body;
    const reportId = req.params.id;
    
    try {
        console.log('Updating report with fields:', DB_FIELDS.length);
        
        // Create SET clause for UPDATE
        const setClause = DB_FIELDS.map((field, index) => `${field} = $${index + 1}`).join(', ');
        
        const query = `
            UPDATE scouting_reports SET
                ${setClause},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $${DB_FIELDS.length + 1}
        `;
        
        // Extract values in the correct order, using null for missing fields
        const values = DB_FIELDS.map(field => {
            const value = data[field];
            return (value !== undefined && value !== '') ? value : null;
        });
        
        // Add the report ID as the last parameter
        values.push(reportId);
        
        console.log('Update query has', DB_FIELDS.length, 'columns and', values.length, 'values');
        
        const result = await pool.query(query, values);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        res.json({ message: 'Report updated successfully' });
        
    } catch (err) {
        console.error('Database error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ 
            error: 'Failed to update report', 
            details: err.message 
        });
    }
});

// Delete scouting report
app.delete('/api/reports/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM scouting_reports WHERE id = $1', [req.params.id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete report' });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});