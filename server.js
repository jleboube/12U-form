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
        const query = `
            INSERT INTO scouting_reports (
                scout_name, scout_date, event, league_organization,
                player_name, primary_position, jersey_number, date_of_birth, age, height, weight,
                bats, throws, team, parent_guardian, contact,
                build, coordination, athleticism, motor_skills, growth_projection,
                stance_setup, swing_mechanics, contact_ability, power_potential, plate_discipline,
                bat_speed, approach, bunting,
                speed, base_running_iq, stealing_ability, first_step, turns,
                fielding_readiness, glove_work, footwork, arm_strength, arm_accuracy,
                range_field, game_awareness, positions_played,
                fastball_mph, control_pitching, breaking_ball, changeup, delivery, mound_presence, strikes,
                game_understanding, coachability, effort_level, competitiveness, teamwork,
                focus_attention, leadership,
                biggest_strengths, improvement_areas, recommended_focus,
                current_level, development_potential, recommended_next_steps,
                playing_time_recommendation, position_projection, additional_training,
                work_at_home, positive_reinforcement,
                notes_observations, next_evaluation_date, followup_items
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
                $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41,
                $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54,
                $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65
            ) RETURNING id
        `;
        
        const values = [
            data.scout_name, data.scout_date, data.event, data.league_organization,
            data.player_name, data.primary_position, data.jersey_number, data.date_of_birth,
            data.age, data.height, data.weight, data.bats, data.throws, data.team,
            data.parent_guardian, data.contact, data.build, data.coordination, data.athleticism,
            data.motor_skills, data.growth_projection, data.stance_setup, data.swing_mechanics,
            data.contact_ability, data.power_potential, data.plate_discipline, data.bat_speed,
            data.approach, data.bunting, data.speed, data.base_running_iq, data.stealing_ability,
            data.first_step, data.turns, data.fielding_readiness, data.glove_work, data.footwork,
            data.arm_strength, data.arm_accuracy, data.range_field, data.game_awareness,
            data.positions_played, data.fastball_mph, data.control_pitching, data.breaking_ball,
            data.changeup, data.delivery, data.mound_presence, data.strikes, data.game_understanding,
            data.coachability, data.effort_level, data.competitiveness, data.teamwork,
            data.focus_attention, data.leadership, data.biggest_strengths, data.improvement_areas,
            data.recommended_focus, data.current_level, data.development_potential,
            data.recommended_next_steps, data.playing_time_recommendation, data.position_projection,
            data.additional_training, data.work_at_home, data.positive_reinforcement,
            data.notes_observations, data.next_evaluation_date, data.followup_items
        ];
        
        const result = await pool.query(query, values);
        res.json({ id: result.rows[0].id, message: 'Report created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create report' });
    }
});

// Update scouting report
app.put('/api/reports/:id', async (req, res) => {
    const data = req.body;
    const reportId = req.params.id;
    
    try {
        const query = `
            UPDATE scouting_reports SET
                scout_name = $1, scout_date = $2, event = $3, league_organization = $4,
                player_name = $5, primary_position = $6, jersey_number = $7, date_of_birth = $8,
                age = $9, height = $10, weight = $11, bats = $12, throws = $13, team = $14,
                parent_guardian = $15, contact = $16, build = $17, coordination = $18,
                athleticism = $19, motor_skills = $20, growth_projection = $21, stance_setup = $22,
                swing_mechanics = $23, contact_ability = $24, power_potential = $25,
                plate_discipline = $26, bat_speed = $27, approach = $28, bunting = $29,
                speed = $30, base_running_iq = $31, stealing_ability = $32, first_step = $33,
                turns = $34, fielding_readiness = $35, glove_work = $36, footwork = $37,
                arm_strength = $38, arm_accuracy = $39, range_field = $40, game_awareness = $41,
                positions_played = $42, fastball_mph = $43, control_pitching = $44,
                breaking_ball = $45, changeup = $46, delivery = $47, mound_presence = $48,
                strikes = $49, game_understanding = $50, coachability = $51, effort_level = $52,
                competitiveness = $53, teamwork = $54, focus_attention = $55, leadership = $56,
                biggest_strengths = $57, improvement_areas = $58, recommended_focus = $59,
                current_level = $60, development_potential = $61, recommended_next_steps = $62,
                playing_time_recommendation = $63, position_projection = $64,
                additional_training = $65, work_at_home = $66, positive_reinforcement = $67,
                notes_observations = $68, next_evaluation_date = $69, followup_items = $70,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $71
        `;
        
        const values = [
            data.scout_name, data.scout_date, data.event, data.league_organization,
            data.player_name, data.primary_position, data.jersey_number, data.date_of_birth,
            data.age, data.height, data.weight, data.bats, data.throws, data.team,
            data.parent_guardian, data.contact, data.build, data.coordination, data.athleticism,
            data.motor_skills, data.growth_projection, data.stance_setup, data.swing_mechanics,
            data.contact_ability, data.power_potential, data.plate_discipline, data.bat_speed,
            data.approach, data.bunting, data.speed, data.base_running_iq, data.stealing_ability,
            data.first_step, data.turns, data.fielding_readiness, data.glove_work, data.footwork,
            data.arm_strength, data.arm_accuracy, data.range_field, data.game_awareness,
            data.positions_played, data.fastball_mph, data.control_pitching, data.breaking_ball,
            data.changeup, data.delivery, data.mound_presence, data.strikes, data.game_understanding,
            data.coachability, data.effort_level, data.competitiveness, data.teamwork,
            data.focus_attention, data.leadership, data.biggest_strengths, data.improvement_areas,
            data.recommended_focus, data.current_level, data.development_potential,
            data.recommended_next_steps, data.playing_time_recommendation, data.position_projection,
            data.additional_training, data.work_at_home, data.positive_reinforcement,
            data.notes_observations, data.next_evaluation_date, data.followup_items, reportId
        ];
        
        const result = await pool.query(query, values);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        
        res.json({ message: 'Report updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update report' });
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