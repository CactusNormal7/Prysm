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

  // Delete the invite
  const { error } = await supabase
    .from('room_invites')
    .delete()
    .eq('id', invite_id)
    .eq('invitee_id', user_id)
    .eq('status', 'pending')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to decline room invite'
    })
  }

  return { success: true }
})
