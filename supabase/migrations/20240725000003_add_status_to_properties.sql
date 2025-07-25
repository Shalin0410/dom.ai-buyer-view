-- Drop the existing property_status type if it exists to avoid conflicts
DROP TYPE IF EXISTS property_status CASCADE;

-- Create the property_status type with the correct values
CREATE TYPE property_status AS ENUM (
  'saved',
  'passed',
  'loved',
  'tour_scheduled',
  'researching',
  'viewing',
  'offer_submitted',
  'under_contract',
  'in_escrow',
  'closed',
  'withdrawn'
);

-- Add status column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS status property_status 
NOT NULL 
DEFAULT 'researching';

-- Add a comment to describe the column
COMMENT ON COLUMN properties.status IS 'Current status of the property in the buying process';

-- Create an index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
