import { supabase } from '@/lib/supabase'

export async function uploadEventImage(eventId: string, file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const fileName = `${eventId}/${folder}-${Date.now()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('event-assets').upload(fileName, file, { upsert: true })
  if (uploadError) throw new Error(uploadError.message)
  const { data } = supabase.storage.from('event-assets').getPublicUrl(fileName)
  return data.publicUrl
}
