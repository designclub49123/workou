-- Add verification and reliability fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS aadhaar_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS college_id_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS face_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS college_name text,
ADD COLUMN IF NOT EXISTS college_id_url text,
ADD COLUMN IF NOT EXISTS aadhaar_url text,
ADD COLUMN IF NOT EXISTS face_photo_url text,
ADD COLUMN IF NOT EXISTS reliability_score numeric DEFAULT 100,
ADD COLUMN IF NOT EXISTS total_no_shows integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_late_arrivals integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS banned_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS night_shift_opted_out boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS working_radius_km integer DEFAULT 25,
ADD COLUMN IF NOT EXISTS backup_pool_member boolean DEFAULT false;

-- Create emergency contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL,
  phone text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own emergency contacts"
ON public.emergency_contacts FOR ALL
USING (auth.uid() = user_id);

-- Create safety check-ins table for GPS tracking during jobs
CREATE TABLE IF NOT EXISTS public.safety_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  checkin_type text NOT NULL, -- 'start', 'periodic', 'end', 'sos'
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.safety_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own checkins"
ON public.safety_checkins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and organizers can view checkins"
ON public.safety_checkins FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = safety_checkins.job_id AND jobs.organizer_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create QR check-in codes table
CREATE TABLE IF NOT EXISTS public.qr_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  qr_code text NOT NULL UNIQUE,
  checked_in_at timestamp with time zone,
  checked_out_at timestamp with time zone,
  is_late boolean DEFAULT false,
  minutes_late integer DEFAULT 0,
  verified_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.qr_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers and organizers can manage QR checkins"
ON public.qr_checkins FOR ALL
USING (
  auth.uid() = worker_id OR 
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = qr_checkins.job_id AND jobs.organizer_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create backup worker pool table
CREATE TABLE IF NOT EXISTS public.backup_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  worker_id uuid NOT NULL,
  status text DEFAULT 'standby', -- 'standby', 'called', 'confirmed', 'declined'
  called_at timestamp with time zone,
  response_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(job_id, worker_id)
);

ALTER TABLE public.backup_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers and organizers can manage backup pool"
ON public.backup_pool FOR ALL
USING (
  auth.uid() = worker_id OR 
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = backup_pool.job_id AND jobs.organizer_id = auth.uid()
  ) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add more job categories
INSERT INTO public.job_categories (name, description, icon) VALUES
  ('Decoration', 'Event decoration and setup helpers', 'Palette'),
  ('Festival Staff', 'Festival and carnival workers', 'PartyPopper'),
  ('Hotel Temp', 'Temporary hotel and hospitality staff', 'Building'),
  ('Retail', 'Retail store assistants and promoters', 'ShoppingBag'),
  ('Logistics', 'Delivery and warehouse support', 'Truck'),
  ('Campus Events', 'College and university event staff', 'GraduationCap'),
  ('Promotional', 'Brand promotion and marketing gigs', 'Megaphone'),
  ('Housekeeping', 'Cleaning and housekeeping services', 'Sparkles')
ON CONFLICT DO NOTHING;

-- Add is_night_shift column to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS is_night_shift boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_transport boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS advance_payment_percent integer DEFAULT 0;