import { supabase } from './supabase'

export async function uploadEventImage(eventId: string, file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const fileName = `${folder}/${eventId}-${Date.now()}.${ext}`
  const { error } = await supabase.storage
    .from('event-assets')
    .upload(fileName, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('event-assets').getPublicUrl(fileName)
  return data.publicUrl
}
