-- Migration pour supprimer toutes les entrées KCTheGoat de la base de données
-- À exécuter dans l'éditeur SQL de Supabase

-- Supprimer les participations aux rooms de KCTheGoat
DELETE FROM public.room_participants 
WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE username = 'KCTheGoat' OR display_name = 'KCTheGoat'
);

-- Supprimer les invitations de rooms de KCTheGoat
DELETE FROM public.room_invites 
WHERE inviter_id IN (
  SELECT id FROM public.users 
  WHERE username = 'KCTheGoat' OR display_name = 'KCTheGoat'
) OR invitee_id IN (
  SELECT id FROM public.users 
  WHERE username = 'KCTheGoat' OR display_name = 'KCTheGoat'
);

-- Supprimer les amitiés de KCTheGoat
DELETE FROM public.friendships 
WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE username = 'KCTheGoat' OR display_name = 'KCTheGoat'
) OR friend_id IN (
  SELECT id FROM public.users 
  WHERE username = 'KCTheGoat' OR display_name = 'KCTheGoat'
);

-- Supprimer les rooms créées par KCTheGoat
DELETE FROM public.rooms 
WHERE creator_id IN (
  SELECT id FROM public.users 
  WHERE username = 'KCTheGoat' OR display_name = 'KCTheGoat'
);

-- Supprimer l'utilisateur KCTheGoat
DELETE FROM public.users 
WHERE username = 'KCTheGoat' OR display_name = 'KCTheGoat';

-- Vérifier qu'il ne reste plus d'entrées KCTheGoat
SELECT 'room_participants' as table_name, COUNT(*) as count FROM public.room_participants rp
JOIN public.users u ON rp.user_id = u.id
WHERE u.username = 'KCTheGoat' OR u.display_name = 'KCTheGoat'
UNION ALL
SELECT 'room_invites' as table_name, COUNT(*) as count FROM public.room_invites ri
JOIN public.users u ON ri.inviter_id = u.id OR ri.invitee_id = u.id
WHERE u.username = 'KCTheGoat' OR u.display_name = 'KCTheGoat'
UNION ALL
SELECT 'friendships' as table_name, COUNT(*) as count FROM public.friendships f
JOIN public.users u ON f.user_id = u.id OR f.friend_id = u.id
WHERE u.username = 'KCTheGoat' OR u.display_name = 'KCTheGoat'
UNION ALL
SELECT 'rooms' as table_name, COUNT(*) as count FROM public.rooms r
JOIN public.users u ON r.creator_id = u.id
WHERE u.username = 'KCTheGoat' OR u.display_name = 'KCTheGoat'
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM public.users u
WHERE u.username = 'KCTheGoat' OR u.display_name = 'KCTheGoat';
