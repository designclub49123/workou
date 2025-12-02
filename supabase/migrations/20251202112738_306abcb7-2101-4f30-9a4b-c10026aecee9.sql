-- Fix function search path for security
ALTER FUNCTION public.log_user_activity(UUID, TEXT, TEXT, TEXT, UUID) SET search_path = public;
ALTER FUNCTION public.notify_application_update() SET search_path = public;