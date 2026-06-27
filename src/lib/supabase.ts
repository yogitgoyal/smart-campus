import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env')
}

// Single browser-side Supabase client, used ONLY for Storage (file upload/
// download). Database reads/writes still go through Prisma + your API
// routes -- this client never touches the Postgres tables directly.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

const ASSIGNMENTS_BUCKET = 'assignments'

/**
 * Uploads a file to the public `assignments` bucket under a given folder
 * (e.g. "submissions/<studentId>" or "assignment-files/<assignmentId>") and
 * returns its public URL. Filenames are prefixed with a timestamp so two
 * uploads with the same original name never collide or overwrite each other.
 */
export async function uploadAssignmentFile(file: File, folder: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${folder}/${Date.now()}_${safeName}`

  const { error } = await supabase.storage.from(ASSIGNMENTS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  const { data } = supabase.storage.from(ASSIGNMENTS_BUCKET).getPublicUrl(path)
  return data.publicUrl
}