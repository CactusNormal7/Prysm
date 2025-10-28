-- Supprimer les anciennes policies problématiques
DROP POLICY IF EXISTS "Users can subscribe to room participants for accessible rooms" ON public.room_participants;

-- ✅ Nouvelle policy sécurisée
CREATE POLICY "Users can view participants of accessible rooms"
  ON public.room_participants
  FOR SELECT
  USING (
    -- Accessible si le room est public ou créé par l’utilisateur
    room_id IN (
      SELECT r.id
      FROM public.rooms AS r
      WHERE r.type = 'public'
         OR r.creator_id = auth.uid()
         OR r.id IN (
            SELECT i.room_id
            FROM public.room_invites AS i
            WHERE i.invitee_id = auth.uid() AND i.status = 'accepted'
         )
    )
    OR user_id = auth.uid() -- ou si c’est lui-même
  );