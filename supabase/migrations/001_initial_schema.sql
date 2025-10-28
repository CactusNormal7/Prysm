-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 100,
  rooms_joined INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('public', 'private')) DEFAULT 'public',
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  deadline_date TIMESTAMP WITH TIME ZONE NOT NULL,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  result_home INTEGER,
  result_away INTEGER,
  status TEXT CHECK (status IN ('open', 'locked', 'finished')) DEFAULT 'open',
  entry_fee INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room participants table
CREATE TABLE IF NOT EXISTS public.room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prediction_home INTEGER NOT NULL,
  prediction_away INTEGER NOT NULL,
  points_bet INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  rank INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Room invites table (for private rooms)
CREATE TABLE IF NOT EXISTS public.room_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, invitee_id)
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_invites ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Friendships policies
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id);

-- Rooms policies
CREATE POLICY "Users can view all public rooms"
  ON public.rooms FOR SELECT
  USING (type = 'public');

CREATE POLICY "Room creators can view own rooms"
  ON public.rooms FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room creators can update own rooms"
  ON public.rooms FOR UPDATE
  USING (creator_id = auth.uid());

-- Room participants policies
CREATE POLICY "Users can view all participants"
  ON public.room_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join rooms"
  ON public.room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.room_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Room invites policies
CREATE POLICY "Users can view own invites"
  ON public.room_invites FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Users can create invites"
  ON public.room_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update own invites"
  ON public.room_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

