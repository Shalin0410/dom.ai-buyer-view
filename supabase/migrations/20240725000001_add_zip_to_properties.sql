-- Add zip column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS zip VARCHAR(20);

-- Add a comment to describe the column
COMMENT ON COLUMN properties.zip IS 'Postal/ZIP code of the property';
