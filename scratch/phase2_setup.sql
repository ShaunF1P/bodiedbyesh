-- ─── 1. Create workouts table ───
create table if not exists public.workouts (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.client_profiles(id) on delete cascade not null,
  date date not null,
  name text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── 2. Create workout_exercises table ───
create table if not exists public.workout_exercises (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_name text not null,
  target_sets int not null default 3,
  target_reps text not null default '10',
  target_weight_lbs int,
  order_index int not null default 0
);

-- ─── 3. Create logged_sets table ───
create table if not exists public.logged_sets (
  id uuid default gen_random_uuid() primary key,
  workout_exercise_id uuid references public.workout_exercises(id) on delete cascade not null,
  set_index int not null,
  reps_completed int,
  weight_lifted_lbs int,
  is_completed boolean default false not null,
  logged_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── 4. Create chat_messages table ───
create table if not exists public.chat_messages (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.client_profiles(id) on delete cascade not null,
  sender text check (sender in ('client', 'coach')) not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── 5. Enable Row-Level Security (RLS) ───
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.logged_sets enable row level security;
alter table public.chat_messages enable row level security;

-- ─── 6. Create Security Policies ───

-- Workouts Policies
create policy "Allow client read workouts" on public.workouts
  for select using (
    auth.uid() = client_id
  );

create policy "Allow service role full access workouts" on public.workouts
  for all using (true);

-- Workout Exercises Policies
create policy "Allow client read exercises" on public.workout_exercises
  for select using (
    exists (
      select 1 from public.workouts
      where public.workouts.id = public.workout_exercises.workout_id
      and public.workouts.client_id = auth.uid()
    )
  );

create policy "Allow service role full access exercises" on public.workout_exercises
  for all using (true);

-- Logged Sets Policies
create policy "Allow client full access logged sets" on public.logged_sets
  for all using (
    exists (
      select 1 from public.workout_exercises
      join public.workouts on public.workouts.id = public.workout_exercises.workout_id
      where public.workout_exercises.id = public.logged_sets.workout_exercise_id
      and public.workouts.client_id = auth.uid()
    )
  );

create policy "Allow service role full access logged sets" on public.logged_sets
  for all using (true);

-- Chat Messages Policies
create policy "Allow client message access" on public.chat_messages
  for all using (
    auth.uid() = client_id
  );

create policy "Allow service role full access chat messages" on public.chat_messages
  for all using (true);
