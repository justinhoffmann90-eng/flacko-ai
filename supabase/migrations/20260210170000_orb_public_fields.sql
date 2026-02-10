-- Add public-facing fields and stance to orb_setup_definitions
ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS public_name TEXT;
ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS public_description TEXT;
ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS one_liner TEXT;
ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS category_tags TEXT[];
ALTER TABLE orb_setup_definitions ADD COLUMN IF NOT EXISTS stance TEXT CHECK (stance IN ('offensive', 'defensive'));
