import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method !== 'DELETE') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const query = getQuery(event)
  const { invite_id, user_id } = query

  if (!invite_id || !user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invite ID and User ID are required'
    })
  }

  // Get Supabase credentials from runtime config
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey
  )

  // Verify the user is the inviter (creator of the room)
  const { data: invite, error: inviteError } = await supabase
    .from('room_invites')
    .select(`
      *,
      room:rooms!room_invites_room_id_fkey (
        creator_id
      )
    `)
    .eq('id', invite_id)
    .single()

  if (inviteError || !invite) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invite not found'
    })
  }

  // Check if user is the creator of the room
  if (invite.room.creator_id !== user_id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only room creators can delete invites'
    })
  }

  // Delete the invite
  const { error: deleteError } = await supabase
    .from('room_invites')
    .delete()
    .eq('id', invite_id)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete invite'
    })
  }

  return { success: true, message: 'Invite deleted successfully' }
})
