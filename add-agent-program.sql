-- Agent Program Database Schema
-- This adds the agent program functionality to SmartGrow platform

-- Add agent-related columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_agent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS agent_status TEXT DEFAULT 'not_eligible',
ADD COLUMN IF NOT EXISTS agent_activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agent_salary_last_paid TIMESTAMP WITH TIME ZONE;

-- Create agent_eligibility_tracking table to track progress
CREATE TABLE IF NOT EXISTS agent_eligibility_tracking (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    level1_active_count INTEGER DEFAULT 0,
    level2_active_count INTEGER DEFAULT 0,
    level3_active_count INTEGER DEFAULT 0,
    eligibility_achieved BOOLEAN DEFAULT FALSE,
    eligibility_achieved_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_rewards table to track agent rewards and salary payments
CREATE TABLE IF NOT EXISTS agent_rewards (
    id SERIAL PRIMARY KEY,
    agent_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL, -- 'initial_bonus', 'weekly_salary', 'commission'
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    payment_method TEXT, -- 'bank_transfer', 'balance_credit'
    payment_reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Add agent program settings to admin_settings
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS agent_initial_bonus NUMERIC DEFAULT 50000,
ADD COLUMN IF NOT EXISTS agent_weekly_salary NUMERIC DEFAULT 50000,
ADD COLUMN IF NOT EXISTS agent_commission_percent NUMERIC DEFAULT 2,
ADD COLUMN IF NOT EXISTS agent_l1_requirement INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS agent_l2_requirement INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS agent_l3_requirement INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS agent_salary_l1_requirement INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS agent_salary_l2_requirement INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS agent_salary_l3_requirement INTEGER DEFAULT 5;

-- Update admin_settings with default values
UPDATE admin_settings SET 
    agent_initial_bonus = 50000,
    agent_weekly_salary = 50000,
    agent_commission_percent = 2,
    agent_l1_requirement = 80,
    agent_l2_requirement = 40,
    agent_l3_requirement = 20,
    agent_salary_l1_requirement = 15,
    agent_salary_l2_requirement = 10,
    agent_salary_l3_requirement = 5
WHERE id = 1;

-- Function to count active members (users with deposits and active plans)
CREATE OR REPLACE FUNCTION count_active_members(referrer_id UUID, level_num INTEGER)
RETURNS INTEGER AS $$
DECLARE
    active_count INTEGER := 0;
    level1_users UUID[];
    level2_users UUID[];
    target_users UUID[];
BEGIN
    -- Get level 1 users (direct referrals)
    SELECT ARRAY_AGG(id) INTO level1_users
    FROM user_profiles 
    WHERE referred_by = referrer_id;
    
    IF level_num = 1 THEN
        target_users := level1_users;
    ELSIF level_num = 2 THEN
        -- Get level 2 users (referrals of level 1 users)
        SELECT ARRAY_AGG(id) INTO level2_users
        FROM user_profiles 
        WHERE referred_by = ANY(level1_users);
        target_users := level2_users;
    ELSIF level_num = 3 THEN
        -- Get level 2 users first
        SELECT ARRAY_AGG(id) INTO level2_users
        FROM user_profiles 
        WHERE referred_by = ANY(level1_users);
        
        -- Get level 3 users (referrals of level 2 users)
        SELECT ARRAY_AGG(id) INTO target_users
        FROM user_profiles 
        WHERE referred_by = ANY(level2_users);
    END IF;
    
    -- Count active users (those with approved deposits and active investments)
    IF target_users IS NOT NULL THEN
        SELECT COUNT(DISTINCT u.id) INTO active_count
        FROM user_profiles u
        WHERE u.id = ANY(target_users)
        AND EXISTS (
            SELECT 1 FROM deposits d 
            WHERE d.user_id = u.id 
            AND d.status IN ('Completed', 'completed', 'Approved', 'approved', 'Success', 'success')
        )
        AND EXISTS (
            SELECT 1 FROM investments i 
            WHERE i.user_id = u.id 
            AND i.status IN ('Active', 'active', 'Running', 'running', 'Approved', 'approved')
        );
    END IF;
    
    RETURN COALESCE(active_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update agent eligibility tracking
CREATE OR REPLACE FUNCTION update_agent_eligibility(user_id UUID)
RETURNS VOID AS $$
DECLARE
    l1_count INTEGER;
    l2_count INTEGER;
    l3_count INTEGER;
    l1_req INTEGER;
    l2_req INTEGER;
    l3_req INTEGER;
    is_eligible BOOLEAN := FALSE;
BEGIN
    -- Get requirements from admin settings
    SELECT agent_l1_requirement, agent_l2_requirement, agent_l3_requirement
    INTO l1_req, l2_req, l3_req
    FROM admin_settings WHERE id = 1;
    
    -- Count active members at each level
    l1_count := count_active_members(user_id, 1);
    l2_count := count_active_members(user_id, 2);
    l3_count := count_active_members(user_id, 3);
    
    -- Check if eligible
    IF l1_count >= l1_req AND l2_count >= l2_req AND l3_count >= l3_req THEN
        is_eligible := TRUE;
    END IF;
    
    -- Insert or update tracking record
    INSERT INTO agent_eligibility_tracking (
        user_id, level1_active_count, level2_active_count, level3_active_count, 
        eligibility_achieved, eligibility_achieved_at, last_updated
    ) VALUES (
        user_id, l1_count, l2_count, l3_count, 
        is_eligible, 
        CASE WHEN is_eligible THEN NOW() ELSE NULL END,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        level1_active_count = EXCLUDED.level1_active_count,
        level2_active_count = EXCLUDED.level2_active_count,
        level3_active_count = EXCLUDED.level3_active_count,
        eligibility_achieved = EXCLUDED.eligibility_achieved,
        eligibility_achieved_at = CASE 
            WHEN EXCLUDED.eligibility_achieved AND NOT agent_eligibility_tracking.eligibility_achieved 
            THEN NOW() 
            ELSE agent_eligibility_tracking.eligibility_achieved_at 
        END,
        last_updated = NOW();
    
    -- Update user agent status
    UPDATE user_profiles SET 
        agent_status = CASE 
            WHEN is_eligible THEN 'eligible' 
            ELSE 'not_eligible' 
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to activate agent and give initial bonus
CREATE OR REPLACE FUNCTION activate_agent(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    initial_bonus NUMERIC;
    eligibility_check BOOLEAN;
BEGIN
    -- Check if user is eligible
    SELECT eligibility_achieved INTO eligibility_check
    FROM agent_eligibility_tracking
    WHERE user_id = activate_agent.user_id;
    
    IF NOT eligibility_check THEN
        RETURN FALSE;
    END IF;
    
    -- Get initial bonus amount
    SELECT agent_initial_bonus INTO initial_bonus
    FROM admin_settings WHERE id = 1;
    
    -- Update user as agent
    UPDATE user_profiles SET 
        is_agent = TRUE,
        agent_status = 'active',
        agent_activated_at = NOW()
    WHERE id = user_id;
    
    -- Record initial bonus reward
    INSERT INTO agent_rewards (agent_id, reward_type, amount, status)
    VALUES (user_id, 'initial_bonus', initial_bonus, 'pending');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check salary eligibility and process weekly salary
CREATE OR REPLACE FUNCTION process_agent_salary(agent_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    l1_count INTEGER;
    l2_count INTEGER;
    l3_count INTEGER;
    l1_req INTEGER;
    l2_req INTEGER;
    l3_req INTEGER;
    weekly_salary NUMERIC;
    last_paid TIMESTAMP WITH TIME ZONE;
    is_salary_eligible BOOLEAN := FALSE;
BEGIN
    -- Check if user is an active agent
    SELECT agent_salary_last_paid INTO last_paid
    FROM user_profiles 
    WHERE id = agent_id AND is_agent = TRUE AND agent_status = 'active';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Check if a week has passed since last salary payment
    IF last_paid IS NOT NULL AND last_paid > NOW() - INTERVAL '7 days' THEN
        RETURN FALSE;
    END IF;
    
    -- Get salary requirements
    SELECT agent_salary_l1_requirement, agent_salary_l2_requirement, agent_salary_l3_requirement, agent_weekly_salary
    INTO l1_req, l2_req, l3_req, weekly_salary
    FROM admin_settings WHERE id = 1;
    
    -- Count current active members
    l1_count := count_active_members(agent_id, 1);
    l2_count := count_active_members(agent_id, 2);
    l3_count := count_active_members(agent_id, 3);
    
    -- Check salary eligibility
    IF l1_count >= l1_req AND l2_count >= l2_req AND l3_count >= l3_req THEN
        is_salary_eligible := TRUE;
    END IF;
    
    -- Process salary if eligible
    IF is_salary_eligible THEN
        -- Record salary payment
        INSERT INTO agent_rewards (agent_id, reward_type, amount, status)
        VALUES (agent_id, 'weekly_salary', weekly_salary, 'pending');
        
        -- Update last paid timestamp
        UPDATE user_profiles SET agent_salary_last_paid = NOW()
        WHERE id = agent_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add unique constraint to agent_eligibility_tracking
ALTER TABLE agent_eligibility_tracking 
ADD CONSTRAINT unique_user_eligibility UNIQUE (user_id);

-- Row Level Security for new tables
ALTER TABLE agent_eligibility_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rewards ENABLE ROW LEVEL SECURITY;

-- Policies for agent_eligibility_tracking
CREATE POLICY "Users can view own eligibility tracking" ON agent_eligibility_tracking
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all eligibility tracking" ON agent_eligibility_tracking
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Policies for agent_rewards
CREATE POLICY "Agents can view own rewards" ON agent_rewards
    FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Admins can manage all rewards" ON agent_rewards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND user_level >= 999
        )
    );

-- Trigger to update agent eligibility when deposits or investments change
CREATE OR REPLACE FUNCTION trigger_update_agent_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    referrer_ids UUID[];
BEGIN
    -- Get all potential referrers who might be affected by this change
    WITH RECURSIVE referrer_chain AS (
        -- Start with the user who made the deposit/investment
        SELECT referred_by as referrer_id, 1 as level
        FROM user_profiles 
        WHERE id = COALESCE(NEW.user_id, OLD.user_id)
        AND referred_by IS NOT NULL
        
        UNION ALL
        
        -- Get referrers up to 3 levels
        SELECT up.referred_by, rc.level + 1
        FROM user_profiles up
        JOIN referrer_chain rc ON up.id = rc.referrer_id
        WHERE rc.level < 3 AND up.referred_by IS NOT NULL
    )
    SELECT ARRAY_AGG(DISTINCT referrer_id) INTO referrer_ids
    FROM referrer_chain;
    
    -- Update eligibility for all affected referrers
    IF referrer_ids IS NOT NULL THEN
        PERFORM update_agent_eligibility(unnest(referrer_ids));
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update agent eligibility
CREATE TRIGGER update_agent_eligibility_on_deposit
    AFTER INSERT OR UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION trigger_update_agent_eligibility();

CREATE TRIGGER update_agent_eligibility_on_investment
    AFTER INSERT OR UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION trigger_update_agent_eligibility();
