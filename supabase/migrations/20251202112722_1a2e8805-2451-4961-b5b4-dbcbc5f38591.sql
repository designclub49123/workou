-- Add job_bookmarks table for saving jobs
CREATE TABLE public.job_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS on job_bookmarks
ALTER TABLE public.job_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_bookmarks
CREATE POLICY "Users can manage own bookmarks" ON public.job_bookmarks
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookmarks" ON public.job_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

-- Add expected_wage and availability columns to job_applications if not exists
ALTER TABLE public.job_applications 
  ADD COLUMN IF NOT EXISTS expected_wage NUMERIC,
  ADD COLUMN IF NOT EXISTS availability TEXT,
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add job categories table
CREATE TABLE public.job_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on job_categories
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories" ON public.job_categories
  FOR SELECT USING (true);

-- Admin can manage categories
CREATE POLICY "Admins can manage categories" ON public.job_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.job_categories (name, icon, description) VALUES
  ('Events', 'calendar', 'Wedding, corporate events, parties'),
  ('Hospitality', 'coffee', 'Hotels, restaurants, catering'),
  ('Retail', 'shopping-cart', 'Sales, inventory, customer service'),
  ('Logistics', 'truck', 'Delivery, warehouse, packaging'),
  ('Cleaning', 'sparkles', 'Housekeeping, deep cleaning'),
  ('Security', 'shield', 'Guards, bouncers, patrol'),
  ('Technical', 'settings', 'IT support, audio/visual, equipment'),
  ('Promotion', 'megaphone', 'Brand ambassadors, flyering'),
  ('Food Service', 'utensils', 'Cooking, serving, bartending'),
  ('General Labor', 'hammer', 'Moving, setup, manual work');

-- Add category_id to jobs table
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.job_categories(id);

-- Add user_activity table for recent activity feed
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_activity
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Users can view own activity
CREATE POLICY "Users can view own activity" ON public.user_activity
  FOR SELECT USING (auth.uid() = user_id);

-- System can create activity
CREATE POLICY "System can create activity" ON public.user_activity
  FOR INSERT WITH CHECK (true);

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_activity (user_id, activity_type, title, description, related_id)
  VALUES (p_user_id, p_activity_type, p_title, p_description, p_related_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update application status and notify
CREATE OR REPLACE FUNCTION public.notify_application_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification when application status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      NEW.applicant_id,
      CASE NEW.status
        WHEN 'accepted' THEN 'Application Accepted! 🎉'
        WHEN 'rejected' THEN 'Application Update'
        ELSE 'Application Status Changed'
      END,
      CASE NEW.status
        WHEN 'accepted' THEN 'Congratulations! Your application has been accepted.'
        WHEN 'rejected' THEN 'Unfortunately, your application was not selected this time.'
        ELSE 'Your application status has been updated to ' || NEW.status
      END,
      'application_update',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for application notifications
DROP TRIGGER IF EXISTS on_application_status_change ON public.job_applications;
CREATE TRIGGER on_application_status_change
  AFTER UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_application_update();

-- Add realtime for job_applications
ALTER PUBLICATION supabase_realtime ADD TABLE job_applications;
ALTER TABLE job_applications REPLICA IDENTITY FULL;