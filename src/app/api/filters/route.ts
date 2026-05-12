import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabase()
  // 고유 연도 목록
  const { data: yearData } = await supabase
    .from('qual_defects')
    .select('year')
    .order('year', { ascending: false })

  const years = [...new Set(yearData?.map(d => d.year) || [])]

  // 고유 기종 목록
  const { data: modelData } = await supabase
    .from('qual_defects')
    .select('model_name')
    .not('model_name', 'is', null)

  const models = [...new Set(modelData?.map(d => d.model_name).filter(Boolean) || [])]
    .sort()

  return NextResponse.json({ years, models })
}
