-- Add status column to buyer_properties
ALTER TABLE buyer_properties
ADD COLUMN status TEXT 
  NOT NULL 
  DEFAULT 'saved' 
  CHECK (status IN ('saved', 'passed', 'loved', 'tour_scheduled'));

-- Create an index for faster status-based queries
CREATE INDEX idx_buyer_properties_status ON buyer_properties(status);

-- Update existing records to have a default status
UPDATE buyer_properties SET status = 'saved' WHERE status IS NULL;

-- Update RLS policies if needed
-- (Assuming you have RLS enabled on buyer_properties)
-- Add or update policies as necessary
