CREATE TABLE IF NOT EXISTS scouting_reports (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Scout Information
    scout_name VARCHAR(255),
    scout_date DATE,
    event VARCHAR(255),
    league_organization VARCHAR(255),
    
    -- Player Information
    player_name VARCHAR(255) NOT NULL,
    primary_position VARCHAR(50),
    jersey_number VARCHAR(10),
    date_of_birth DATE,
    age INTEGER,
    height VARCHAR(20),
    weight VARCHAR(20),
    bats VARCHAR(10),
    throws VARCHAR(10),
    team VARCHAR(255),
    parent_guardian VARCHAR(255),
    contact VARCHAR(255),
    
    -- Physical Development
    build VARCHAR(50),
    coordination VARCHAR(50),
    athleticism VARCHAR(50),
    motor_skills VARCHAR(50),
    growth_projection VARCHAR(50),
    
    -- Hitting Fundamentals
    stance_setup VARCHAR(50),
    swing_mechanics VARCHAR(50),
    contact_ability VARCHAR(50),
    power_potential VARCHAR(50),
    plate_discipline VARCHAR(50),
    bat_speed VARCHAR(50),
    approach VARCHAR(50),
    bunting VARCHAR(50),
    
    -- Running & Base Running
    speed VARCHAR(50),
    base_running_iq VARCHAR(50),
    stealing_ability VARCHAR(50),
    first_step VARCHAR(50),
    turns VARCHAR(50),
    
    -- Fielding Skills
    fielding_readiness VARCHAR(50),
    glove_work VARCHAR(50),
    footwork VARCHAR(50),
    arm_strength VARCHAR(50),
    arm_accuracy VARCHAR(50),
    range_field VARCHAR(50),
    game_awareness VARCHAR(50),
    positions_played TEXT,
    
    -- Pitching
    fastball_mph VARCHAR(20),
    control_pitching VARCHAR(50),
    breaking_ball VARCHAR(50),
    changeup VARCHAR(50),
    delivery VARCHAR(50),
    mound_presence VARCHAR(50),
    strikes VARCHAR(50),
    
    -- Baseball IQ & Intangibles
    game_understanding VARCHAR(50),
    coachability VARCHAR(50),
    effort_level VARCHAR(50),
    competitiveness VARCHAR(50),
    teamwork VARCHAR(50),
    focus_attention VARCHAR(50),
    leadership VARCHAR(50),
    
    -- Development Areas
    biggest_strengths TEXT,
    improvement_areas TEXT,
    recommended_focus TEXT,
    
    -- Projection & Recommendations
    current_level VARCHAR(50),
    development_potential VARCHAR(50),
    recommended_next_steps TEXT,
    playing_time_recommendation VARCHAR(50),
    position_projection TEXT,
    additional_training TEXT,
    
    -- Coach/Parent Feedback
    work_at_home TEXT,
    positive_reinforcement TEXT,
    
    -- Notes
    notes_observations TEXT,
    next_evaluation_date DATE,
    followup_items TEXT
);

-- Create index for faster queries
CREATE INDEX idx_player_name ON scouting_reports(player_name);
CREATE INDEX idx_created_at ON scouting_reports(created_at);