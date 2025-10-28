import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method !== 'PATCH') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const body = await readBody(event)
  const { invite_id, user_id } = body

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

  // Get the invite
  const { data: invite, error: fetchError } = await supabase
    .from('room_invites')
    .select('*, room:rooms(*)')
    .eq('id', invite_id)
    .eq('invitee_id', user_id)
    .eq('status', 'pending')
    .single()

  if (fetchError || !invite) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Room invite not found'
    })
  }

  // Check if room is still open
  if (invite.room.status !== 'open') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Room is no longer open for joining'
    })
  }

  // Update invite status to accepted
  const { data: updatedInvite, error: updateError } = await supabase
    .from('room_invites')
    .update({ status: 'accepted' })
    .eq('id', invite_id)
    .select()
    .single()

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to accept room invite'
    })
  }

  return updatedInvite
})
