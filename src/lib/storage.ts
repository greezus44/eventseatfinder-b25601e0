import { supabase } from './supabase'

const BUCKET = 'event-assets'

export async function uploadLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadVenueLayout(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'png'
  const path = `layouts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
