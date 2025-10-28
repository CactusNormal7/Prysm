// server/api/rooms/[id]/score.patch.ts
import { createClient } from '@supabase/supabase-js'
import { getMethod, getRouterParam, readBody, createError } from 'h3'

type ScoreUpdate = {
  result_home: number
  result_away: number
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const roomId = getRouterParam(event, 'id')

  if (!roomId) {
    throw createError({ statusCode: 400, statusMessage: 'Room ID is required' })
  }

  if (method !== 'PATCH') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
  }

  const body: ScoreUpdate = await readBody(event)
  const { result_home, result_away } = body

  if (typeof result_home !== 'number' || typeof result_away !== 'number') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid score values' })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.public.supabaseUrl, config.public.supabaseKey)

  const { data: updatedRoom, error: updateErr } = await supabase
    .from('rooms')
    .update({ result_home, result_away })
    .eq('id', roomId)
    .select()
    .maybeSingle()

  if (updateErr) {
    console.error('Error updating room:', updateErr)
    throw createError({ statusCode: 500, statusMessage: `Failed to update room: ${updateErr.message}` })
  }

  if (!updatedRoom) {
    throw createError({ statusCode: 404, statusMessage: 'Room not found or could not be updated' })
  }

  return updatedRoom
})