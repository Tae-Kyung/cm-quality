import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key || url === 'your-supabase-url') {
      throw new Error('Supabase URL과 Key를 .env.local 파일에 설정해주세요.')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}
