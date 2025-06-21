const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'baseball_scouting',
    user: process.env.DB_USER || 'scout_user',
    password: process.env.DB_PASSWORD || 'scout_pass',
});

// Middleware
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
    origin: isProduction ? [
        'https://scouting-report.com',
        'https://www.scouting-report.com'
    ] : true,
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust proxy for proper IP forwarding behind Nginx Proxy Manager
app.set('trust proxy', 1);

// Session configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || 'baseball-scouting-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: isProduction, // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: isProduction ? 'strict' : 'lax'
    }
}));

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

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Authentication required' });
    }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
    if (req.session && req.session.userId && req.session.isAdmin) {
        return next();
    } else {
        return res.status(403).json({ error: 'Admin access required' });
    }
};

// Approved user middleware
const requireApproved = (req, res, next) => {
    if (req.session && req.session.userId && req.session.isApproved) {
        return next();
    } else {
        return res.status(403).json({ error: 'Account pending approval' });
    }
};

// Authentication Routes

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const userQuery = `
            SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, 
                   u.group_id, u.is_approved, u.is_admin, g.name as group_name
            FROM users u 
            LEFT JOIN groups g ON u.group_id = g.id 
            WHERE u.email = $1 AND u.is_active = true
        `;
        
        const result = await pool.query(userQuery, [email.toLowerCase()]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Check if user is approved
        if (!user.is_approved) {
            return res.status(403).json({ 
                error: 'Account pending approval', 
                message: 'Your account is waiting for admin approval. Please contact your team administrator.'
            });
        }
        
        // Set session
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        req.session.groupId = user.group_id;
        req.session.groupName = user.group_name;
        req.session.isApproved = user.is_approved;
        req.session.isAdmin = user.is_admin;
        
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                groupId: user.group_id,
                groupName: user.group_name,
                isApproved: user.is_approved,
                isAdmin: user.is_admin
            }
        });
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, groupId, registrationCode } = req.body;
        
        if (!email || !password || !firstName || !lastName || !groupId) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Get group details and check registration requirements
        const groupQuery = `
            SELECT id, name, registration_code, allow_public_registration 
            FROM groups WHERE id = $1
        `;
        const groupResult = await pool.query(groupQuery, [groupId]);
        
        if (groupResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid team selected' });
        }
        
        const group = groupResult.rows[0];
        
        // Check if registration code is required and valid
        if (group.registration_code && group.registration_code !== registrationCode) {
            return res.status(400).json({ 
                error: 'Invalid registration code for this team',
                requiresCode: true
            });
        }
        
        // Determine if user should be auto-approved
        const isAutoApproved = group.allow_public_registration || false;
        
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Insert user
        const insertQuery = `
            INSERT INTO users (email, password_hash, first_name, last_name, group_id, is_approved)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, first_name, last_name, group_id, is_approved
        `;
        
        const result = await pool.query(insertQuery, [
            email.toLowerCase(), passwordHash, firstName, lastName, groupId, isAutoApproved
        ]);
        
        const user = result.rows[0];
        
        const message = user.is_approved 
            ? 'Registration successful! You can now login.'
            : 'Registration successful! Your account is pending admin approval.';
        
        res.json({
            message: message,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                groupId: user.group_id,
                groupName: group.name,
                isApproved: user.is_approved
            },
            requiresApproval: !user.is_approved
        });
        
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Check authentication status
app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const userQuery = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.group_id, u.is_approved, u.is_admin, g.name as group_name
            FROM users u 
            LEFT JOIN groups g ON u.group_id = g.id 
            WHERE u.id = $1 AND u.is_active = true
        `;
        
        const result = await pool.query(userQuery, [req.session.userId]);
        
        if (result.rows.length === 0) {
            req.session.destroy();
            return res.status(401).json({ error: 'User not found' });
        }
        
        const user = result.rows[0];
        
        // Update session with current user status
        req.session.isApproved = user.is_approved;
        req.session.isAdmin = user.is_admin;
        
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                groupId: user.group_id,
                groupName: user.group_name,
                isApproved: user.is_approved,
                isAdmin: user.is_admin
            }
        });
        
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ error: 'Authentication check failed' });
    }
});

// Get available groups (updated to include registration requirements)
app.get('/api/groups', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name, description, 
                   CASE WHEN registration_code IS NOT NULL THEN true ELSE false END as requires_code
            FROM groups 
            ORDER BY name
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Groups fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch groups' });
    }
});

// Admin Routes

// Get pending users for approval
app.get('/api/admin/pending-users', requireAuth, requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.created_at, g.name as group_name
            FROM users u
            LEFT JOIN groups g ON u.group_id = g.id
            WHERE u.is_approved = false AND u.is_active = true
            ORDER BY u.created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Pending users fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch pending users' });
    }
});

// Approve/deny user
app.post('/api/admin/approve-user/:userId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { approved } = req.body;
        
        if (approved) {
            await pool.query('UPDATE users SET is_approved = true WHERE id = $1', [userId]);
            res.json({ message: 'User approved successfully' });
        } else {
            await pool.query('DELETE FROM users WHERE id = $1', [userId]);
            res.json({ message: 'User registration denied and removed' });
        }
    } catch (err) {
        console.error('User approval error:', err);
        res.status(500).json({ error: 'Failed to process user approval' });
    }
});

// Get team management info (for admins)
app.get('/api/admin/teams', requireAuth, requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT g.id, g.name, g.description, g.registration_code, g.allow_public_registration,
                   COUNT(u.id) as member_count
            FROM groups g
            LEFT JOIN users u ON g.id = u.group_id AND u.is_active = true AND u.is_approved = true
            GROUP BY g.id, g.name, g.description, g.registration_code, g.allow_public_registration
            ORDER BY g.name
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Teams fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Update team settings
app.put('/api/admin/teams/:teamId', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { teamId } = req.params;
        const { name, description, registrationCode, allowPublicRegistration } = req.body;
        
        const query = `
            UPDATE groups 
            SET name = $1, description = $2, registration_code = $3, allow_public_registration = $4
            WHERE id = $5
        `;
        
        await pool.query(query, [name, description, registrationCode || null, allowPublicRegistration, teamId]);
        res.json({ message: 'Team updated successfully' });
    } catch (err) {
        console.error('Team update error:', err);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Create new team
app.post('/api/admin/teams', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, description, registrationCode, allowPublicRegistration } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Team name is required' });
        }
        
        const query = `
            INSERT INTO groups (name, description, registration_code, allow_public_registration)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name
        `;
        
        const result = await pool.query(query, [name, description, registrationCode || null, allowPublicRegistration]);
        res.json({ message: 'Team created successfully', team: result.rows[0] });
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            res.status(400).json({ error: 'Team name already exists' });
        } else {
            console.error('Team creation error:', err);
            res.status(500).json({ error: 'Failed to create team' });
        }
    }
});

// Get team members
app.get('/api/admin/teams/:teamId/members', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { teamId } = req.params;
        const query = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.is_approved, u.is_admin, u.created_at
            FROM users u
            WHERE u.group_id = $1 AND u.is_active = true
            ORDER BY u.last_name, u.first_name
        `;
        const result = await pool.query(query, [teamId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Team members fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch team members' });
    }
});

// Protected Routes (require authentication and approval)

// Get all scouting reports (filtered by user's group)
app.get('/api/reports', requireAuth, requireApproved, async (req, res) => {
    try {
        const query = `
            SELECT sr.id, sr.player_name, sr.primary_position, sr.team, sr.scout_date, sr.created_at,
                   u.first_name, u.last_name
            FROM scouting_reports sr
            LEFT JOIN users u ON sr.user_id = u.id
            WHERE sr.group_id = $1 OR sr.group_id IS NULL
            ORDER BY sr.created_at DESC
        `;
        
        const result = await pool.query(query, [req.session.groupId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});

// Get single scouting report (must be in same group)
app.get('/api/reports/:id', requireAuth, requireApproved, async (req, res) => {
    try {
        const query = `
            SELECT * FROM scouting_reports 
            WHERE id = $1 AND (group_id = $2 OR group_id IS NULL)
        `;
        
        const result = await pool.query(query, [req.params.id, req.session.groupId]);
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
app.post('/api/reports', requireAuth, requireApproved, async (req, res) => {
    const data = req.body;
    
    try {
        console.log('Creating report with fields:', DB_FIELDS.length);
        
        // Add user_id and group_id to the fields and data
        const fieldsWithUser = ['user_id', 'group_id', ...DB_FIELDS];
        const placeholders = fieldsWithUser.map((_, index) => `${index + 1}`).join(', ');
        
        const query = `
            INSERT INTO scouting_reports (${fieldsWithUser.join(', ')}) 
            VALUES (${placeholders}) 
            RETURNING id
        `;
        
        // Extract values, prepending user_id and group_id
        const values = [
            req.session.userId,
            req.session.groupId,
            ...DB_FIELDS.map(field => {
                const value = data[field];
                return (value !== undefined && value !== '') ? value : null;
            })
        ];
        
        console.log('Query has', fieldsWithUser.length, 'columns and', values.length, 'values');
        
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

// Update scouting report (must be in same group)
app.put('/api/reports/:id', requireAuth, requireApproved, async (req, res) => {
    const data = req.body;
    const reportId = req.params.id;
    
    try {
        // First check if report exists and user has access
        const checkQuery = `
            SELECT id FROM scouting_reports 
            WHERE id = $1 AND (group_id = $2 OR group_id IS NULL)
        `;
        
        const checkResult = await pool.query(checkQuery, [reportId, req.session.groupId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found or access denied' });
        }
        
        console.log('Updating report with fields:', DB_FIELDS.length);
        
        const setClause = DB_FIELDS.map((field, index) => `${field} = ${index + 1}`).join(', ');
        
        const query = `
            UPDATE scouting_reports SET
                ${setClause},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${DB_FIELDS.length + 1}
        `;
        
        const values = DB_FIELDS.map(field => {
            const value = data[field];
            return (value !== undefined && value !== '') ? value : null;
        });
        
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

// Delete scouting report (must be in same group)
app.delete('/api/reports/:id', requireAuth, requireApproved, async (req, res) => {
    try {
        const query = `
            DELETE FROM scouting_reports 
            WHERE id = $1 AND (group_id = $2 OR group_id IS NULL)
        `;
        
        const result = await pool.query(query, [req.params.id, req.session.groupId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found or access denied' });
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