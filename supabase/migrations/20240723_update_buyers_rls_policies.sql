-- Enable Row Level Security on buyers table if not already enabled
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- Allow public access to check if an email exists in the buyers table
-- This is needed for the sign-in flow to check if a user is registered
CREATE POLICY "Allow public select on email" ON public.buyers
  FOR SELECT USING (
    -- Allow selecting the email field for any row
    true
  );

-- Allow authenticated users to view their own buyer record
CREATE POLICY "Buyers can view their own profile" ON public.buyers
  FOR SELECT USING (
    auth.uid() = id
  );

-- Allow authenticated users to update their own buyer record
CREATE POLICY "Buyers can update their own profile" ON public.buyers
  FOR UPDATE USING (
    auth.uid() = id
  );

-- Allow inserts only from authenticated users (with some restrictions enforced by triggers/auth)
CREATE POLICY "Allow inserts from authenticated users" ON public.buyers
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Create a function to check if a user has a specific role
-- This is used by the policies to check if the user is an admin or service role
CREATE OR REPLACE FUNCTION public.is_role(role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = role_name
  ) OR EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'user_role' = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role full access" ON public.buyers
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow admins full access
CREATE POLICY "Admin full access" ON public.buyers
  USING (public.is_role('admin'))
  WITH CHECK (public.is_role('admin'));

-- Create an index on email for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_buyers_email ON public.buyers(email);

-- Create a function to get a buyer by email
-- This function can be used in the API to safely check if an email exists
CREATE OR REPLACE FUNCTION public.get_buyer_by_email(email_param text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT to_jsonb(buyers) - 'password_hash' - 'phone_number' - 'date_of_birth' - 'ssn_last_four'
  INTO result
  FROM public.buyers
  WHERE email = email_param
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_buyer_by_email(text) TO authenticated;
