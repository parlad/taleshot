-- Create a function to safely get user email
CREATE OR REPLACE FUNCTION get_user_email(user_id uuid)
RETURNS TABLE (email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT users.email::text
  FROM auth.users
  WHERE users.id = user_id
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;