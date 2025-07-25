-- Add property_type column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_type TEXT 
NOT NULL 
DEFAULT 'single_family' 
CHECK (property_type IN ('single_family', 'condo', 'townhouse', 'multi_family', 'other'));

-- Add a comment to describe the column
COMMENT ON COLUMN properties.property_type IS 'Type of property (single_family, condo, townhouse, multi_family, other)';
