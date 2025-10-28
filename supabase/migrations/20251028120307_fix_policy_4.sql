-- ---- Supprimer les policies problématiques / redondantes ----
DROP POLICY IF EXISTS "Users can subscribe to private rooms they're invited to" ON public.rooms;
DROP POLICY IF EXISTS "Users can subscribe to public rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can view all participants" ON public.room_participants;

-- ---- ROOMS : policy sécurisée (pas de référence à room_participants) ----
DROP POLICY IF EXISTS "Users can view all public rooms" ON public.rooms;
CREATE POLICY "Users can view all public rooms"
  ON public.rooms FOR SELECT
  USING (type = 'public');

DROP POLICY IF EXISTS "Room creators can view own rooms" ON public.rooms;
CREATE POLICY "Room creators can view own rooms"
  ON public.rooms FOR SELECT
  USING (creator_id = auth.uid());

-- Policy générale "accessible" (public / créateur / invité accepté)
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

-- ---- ROOM_PARTICIPANTS : policy sécurisée (dépend seulement de rooms / room_invites, pas l'inverse) ----
DROP POLICY IF EXISTS "Users can view participants of accessible rooms" ON public.room_participants;
CREATE POLICY "Users can view participants of accessible rooms"
  ON public.room_participants FOR SELECT
  USING (
    -- Voir participants si la room est publique, ou si l'utilisateur est le créateur, ou s'il est invité accepté,
    -- ou si c'est sa propre ligne de participation.
    room_id IN (
      SELECT r.id
      FROM public.rooms r
      WHERE r.type = 'public'
         OR r.creator_id = auth.uid()
         OR r.id IN (
            SELECT i.room_id
            FROM public.room_invites i
            WHERE i.invitee_id = auth.uid() AND i.status = 'accepted'
         )
    )
    OR user_id = auth.uid()
  );

-- INSERT : l'utilisateur peut insérer sa propre participation, seulement si la room existe et est 'open'
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;
CREATE POLICY "Users can join rooms"
  ON public.room_participants FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id AND r.status = 'open'
    )
  );

-- UPDATE : l'utilisateur peut modifier sa propre participation
DROP POLICY IF EXISTS "Users can update own participation" ON public.room_participants;
CREATE POLICY "Users can update own participation"
  ON public.room_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- ROOM_INVITES (laisser comme tu as, mais idempotent) ----
DROP POLICY IF EXISTS "Users can view own invites" ON public.room_invites;
CREATE POLICY "Users can view own invites"
  ON public.room_invites FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Users can create invites" ON public.room_invites;
CREATE POLICY "Users can create invites"
  ON public.room_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

DROP POLICY IF EXISTS "Users can update own invites" ON public.room_invites;
CREATE POLICY "Users can update own invites"
  ON public.room_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

-- ---- FRIENDSHIPS & USERS : idempotent (re-création sûre) ----
DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
CREATE POLICY "Users can create friendships"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own friendships" ON public.friendships;
CREATE POLICY "Users can update own friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);