-- Enable Realtime for rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;

-- Enable Realtime for room_participants table
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;

-- Enable Realtime for friendships table
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- Enable Realtime for room_invites table
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_invites;

-- Add RLS policies for Realtime subscriptions
-- Users can subscribe to rooms they can view
CREATE POLICY "Users can subscribe to public rooms"
  ON public.rooms FOR SELECT
  USING (type = 'public');

CREATE POLICY "Users can subscribe to private rooms they're invited to"
  ON public.rooms FOR SELECT
  USING (
    type = 'private' AND (
      creator_id = auth.uid() OR
      id IN (
        SELECT room_id FROM public.room_invites 
        WHERE invitee_id = auth.uid() AND status = 'pending'
      ) OR
      id IN (
        SELECT room_id FROM public.room_participants 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can subscribe to room participants for rooms they can view
CREATE POLICY "Users can subscribe to room participants for accessible rooms"
  ON public.room_participants FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM public.rooms WHERE 
        type = 'public' OR
        creator_id = auth.uid() OR
        id IN (
          SELECT room_id FROM public.room_invites 
          WHERE invitee_id = auth.uid() AND status = 'pending'
        ) OR
        id IN (
          SELECT room_id FROM public.room_participants 
          WHERE user_id = auth.uid()
        )
    )
  );

-- Users can subscribe to their own friendships
CREATE POLICY "Users can subscribe to own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can subscribe to their own room invites
CREATE POLICY "Users can subscribe to own room invites"
  ON public.room_invites FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);
