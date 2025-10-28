-- ROOMS POLICIES (no recursion)
DROP POLICY IF EXISTS "Users can view accessible rooms" ON public.rooms;
CREATE POLICY "Users can view accessible rooms"
  ON public.rooms FOR SELECT
  USING (
    type = 'public'
    OR creator_id = auth.uid()
    OR id IN (
      SELECT i.room_id
      FROM public.room_invites i
      WHERE i.invitee_id = auth.uid() AND i.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
CREATE POLICY "Users can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Room creators can update own rooms" ON public.rooms;
CREATE POLICY "Room creators can update own rooms"
  ON public.rooms FOR UPDATE
  USING (creator_id = auth.uid());