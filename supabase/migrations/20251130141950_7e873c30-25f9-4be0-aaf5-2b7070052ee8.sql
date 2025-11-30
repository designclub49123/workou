-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum for user roles
create type public.app_role as enum ('admin', 'user', 'organizer');

-- Create enum for job status
create type public.job_status as enum ('draft', 'open', 'in_progress', 'completed', 'cancelled');

-- Create enum for application status
create type public.application_status as enum ('pending', 'accepted', 'rejected', 'withdrawn');

-- Create enum for payment status
create type public.payment_status as enum ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Create enum for verification status
create type public.verification_status as enum ('pending', 'verified', 'rejected');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  date_of_birth date,
  address text,
  city text,
  state text,
  pincode text,
  emergency_contact text,
  emergency_phone text,
  verification_status verification_status default 'pending',
  kyc_document_url text,
  is_available boolean default true,
  rating numeric(3,2) default 0,
  total_jobs_completed integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create skills table
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  description text,
  created_at timestamp with time zone default now()
);

alter table public.skills enable row level security;

-- Create user_skills table
create table public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  skill_id uuid references public.skills(id) on delete cascade not null,
  proficiency_level integer check (proficiency_level between 1 and 5),
  years_of_experience numeric(4,1),
  created_at timestamp with time zone default now(),
  unique (user_id, skill_id)
);

alter table public.user_skills enable row level security;

-- Create jobs table
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  event_type text,
  location text not null,
  city text not null,
  state text,
  latitude numeric(10,8),
  longitude numeric(11,8),
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  workers_needed integer not null check (workers_needed > 0),
  workers_hired integer default 0,
  wage_per_hour numeric(10,2) not null,
  total_hours numeric(5,2),
  requirements text[],
  status job_status default 'draft',
  is_urgent boolean default false,
  dress_code text,
  meal_provided boolean default false,
  transportation_provided boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.jobs enable row level security;

-- Create job_skills table (many-to-many)
create table public.job_skills (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  skill_id uuid references public.skills(id) on delete cascade not null,
  is_required boolean default true,
  created_at timestamp with time zone default now(),
  unique (job_id, skill_id)
);

alter table public.job_skills enable row level security;

-- Create job_applications table
create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  applicant_id uuid references auth.users(id) on delete cascade not null,
  status application_status default 'pending',
  cover_letter text,
  applied_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references auth.users(id),
  unique (job_id, applicant_id)
);

alter table public.job_applications enable row level security;

-- Create attendance table
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  worker_id uuid references auth.users(id) on delete cascade not null,
  check_in_time timestamp with time zone,
  check_out_time timestamp with time zone,
  hours_worked numeric(5,2),
  location_verified boolean default false,
  notes text,
  created_at timestamp with time zone default now()
);

alter table public.attendance enable row level security;

-- Create ratings table
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  rater_id uuid references auth.users(id) on delete cascade not null,
  rated_id uuid references auth.users(id) on delete cascade not null,
  rating integer check (rating between 1 and 5) not null,
  review text,
  is_organizer_rating boolean not null,
  created_at timestamp with time zone default now(),
  unique (job_id, rater_id, rated_id)
);

alter table public.ratings enable row level security;

-- Create payments table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade not null,
  worker_id uuid references auth.users(id) on delete cascade not null,
  organizer_id uuid references auth.users(id) on delete cascade not null,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2),
  worker_payout numeric(10,2),
  status payment_status default 'pending',
  payment_method text,
  transaction_id text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.payments enable row level security;

-- Create notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text,
  related_id uuid,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.notifications enable row level security;

-- Create function to check user role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Create function to get user roles
create or replace function public.get_user_roles(_user_id uuid)
returns setof app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.user_roles where user_id = _user_id
$$;

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create profile
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  
  -- Assign default user role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers for updated_at
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_jobs_updated_at before update on public.jobs
  for each row execute function public.update_updated_at_column();

-- RLS Policies for profiles
create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- RLS Policies for user_roles
create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for skills
create policy "Anyone can view skills"
  on public.skills for select
  to authenticated
  using (true);

create policy "Admins can manage skills"
  on public.skills for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_skills
create policy "Users can view all user skills"
  on public.user_skills for select
  to authenticated
  using (true);

create policy "Users can manage own skills"
  on public.user_skills for all
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for jobs
create policy "Anyone can view open jobs"
  on public.jobs for select
  to authenticated
  using (status = 'open' or organizer_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Organizers can create jobs"
  on public.jobs for insert
  to authenticated
  with check (auth.uid() = organizer_id and (public.has_role(auth.uid(), 'organizer') or public.has_role(auth.uid(), 'admin')));

create policy "Organizers can update own jobs"
  on public.jobs for update
  to authenticated
  using (auth.uid() = organizer_id or public.has_role(auth.uid(), 'admin'));

create policy "Organizers can delete own jobs"
  on public.jobs for delete
  to authenticated
  using (auth.uid() = organizer_id or public.has_role(auth.uid(), 'admin'));

-- RLS Policies for job_skills
create policy "Anyone can view job skills"
  on public.job_skills for select
  to authenticated
  using (true);

create policy "Job owners can manage job skills"
  on public.job_skills for all
  to authenticated
  using (
    exists (
      select 1 from public.jobs
      where jobs.id = job_skills.job_id
      and (jobs.organizer_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  );

-- RLS Policies for job_applications
create policy "Users can view own applications"
  on public.job_applications for select
  to authenticated
  using (
    auth.uid() = applicant_id or
    exists (select 1 from public.jobs where jobs.id = job_applications.job_id and jobs.organizer_id = auth.uid()) or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Users can create applications"
  on public.job_applications for insert
  to authenticated
  with check (auth.uid() = applicant_id);

create policy "Users can update own applications"
  on public.job_applications for update
  to authenticated
  using (
    auth.uid() = applicant_id or
    exists (select 1 from public.jobs where jobs.id = job_applications.job_id and jobs.organizer_id = auth.uid()) or
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for attendance
create policy "Users can view own attendance"
  on public.attendance for select
  to authenticated
  using (
    auth.uid() = worker_id or
    exists (select 1 from public.jobs where jobs.id = attendance.job_id and jobs.organizer_id = auth.uid()) or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Job owners and workers can manage attendance"
  on public.attendance for all
  to authenticated
  using (
    auth.uid() = worker_id or
    exists (select 1 from public.jobs where jobs.id = attendance.job_id and jobs.organizer_id = auth.uid()) or
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for ratings
create policy "Users can view all ratings"
  on public.ratings for select
  to authenticated
  using (true);

create policy "Users can create ratings"
  on public.ratings for insert
  to authenticated
  with check (auth.uid() = rater_id);

-- RLS Policies for payments
create policy "Users can view own payments"
  on public.payments for select
  to authenticated
  using (
    auth.uid() = worker_id or
    auth.uid() = organizer_id or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Admins can manage payments"
  on public.payments for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
create policy "Users can view own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id);

create policy "System can create notifications"
  on public.notifications for insert
  to authenticated
  with check (true);

-- Create storage buckets
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
insert into storage.buckets (id, name, public) values ('job-images', 'job-images', true);

-- Storage policies for avatars
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for documents
create policy "Users can view their own documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own documents"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for job images
create policy "Job images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'job-images');

create policy "Organizers can upload job images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'job-images' and (public.has_role(auth.uid(), 'organizer') or public.has_role(auth.uid(), 'admin')));

-- Insert some default skills
insert into public.skills (name, category, description) values
  ('Waiter/Waitress', 'Food Service', 'Serving food and beverages to guests'),
  ('Bartender', 'Food Service', 'Preparing and serving drinks'),
  ('Chef/Cook', 'Food Service', 'Preparing and cooking food'),
  ('Event Setup', 'Event Management', 'Setting up venues for events'),
  ('Event Cleanup', 'Event Management', 'Cleaning and organizing after events'),
  ('Security', 'Safety', 'Providing security services'),
  ('Registration Desk', 'Administration', 'Managing event registration'),
  ('Photographer', 'Media', 'Photography services'),
  ('Videographer', 'Media', 'Video recording services'),
  ('DJ/Music', 'Entertainment', 'Music and entertainment services');
