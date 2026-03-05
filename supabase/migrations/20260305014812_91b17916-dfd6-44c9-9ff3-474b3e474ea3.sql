
-- Add validation trigger for rsvp_responses to enforce constraints server-side
CREATE OR REPLACE FUNCTION public.validate_rsvp_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Sanitize guest_name: remove HTML tags, enforce length
  NEW.guest_name := substring(regexp_replace(NEW.guest_name, '<[^>]*>', '', 'g'), 1, 200);
  
  -- Clamp guests_count between 1 and 20
  IF NEW.guests_count < 1 THEN
    NEW.guests_count := 1;
  ELSIF NEW.guests_count > 20 THEN
    NEW.guests_count := 20;
  END IF;
  
  -- Validate attendance values
  IF NEW.attendance NOT IN ('confirmed', 'declined', 'pending') THEN
    RAISE EXCEPTION 'Invalid attendance value';
  END IF;
  
  -- Sanitize optional fields
  IF NEW.guest_email IS NOT NULL THEN
    NEW.guest_email := substring(regexp_replace(NEW.guest_email, '<[^>]*>', '', 'g'), 1, 255);
  END IF;
  
  IF NEW.message IS NOT NULL THEN
    NEW.message := substring(regexp_replace(NEW.message, '<[^>]*>', '', 'g'), 1, 1000);
  END IF;
  
  IF NEW.dietary_restrictions IS NOT NULL THEN
    NEW.dietary_restrictions := substring(regexp_replace(NEW.dietary_restrictions, '<[^>]*>', '', 'g'), 1, 500);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_rsvp_before_insert
  BEFORE INSERT ON public.rsvp_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_rsvp_response();
