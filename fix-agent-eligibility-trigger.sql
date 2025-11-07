-- Fix the agent eligibility trigger to work with new deposits table structure

-- First, let's see what the current function looks like
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'trigger_update_agent_eligibility';

-- Create a fixed version of the agent eligibility function
CREATE OR REPLACE FUNCTION trigger_update_agent_eligibility()
RETURNS TRIGGER AS $$
BEGIN
    -- Add error handling and use correct column names
    BEGIN
        -- Only process when deposit is approved (not on initial insert)
        IF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
            -- Call the agent eligibility update function
            PERFORM update_agent_eligibility_for_user(NEW.user_id);
        END IF;
        
        RETURN NEW;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the deposit
            RAISE NOTICE 'Error in agent eligibility trigger: %', SQLERRM;
            RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to only run on UPDATE (when deposit is approved), not INSERT
CREATE TRIGGER update_agent_eligibility_on_deposit
    AFTER UPDATE ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_agent_eligibility();

-- Verify the trigger was created correctly
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'deposits' 
AND trigger_name = 'update_agent_eligibility_on_deposit';
