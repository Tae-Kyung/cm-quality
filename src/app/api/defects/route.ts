import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search') || ''
  const year = searchParams.get('year') || ''
  const month = searchParams.get('month') || ''
  const model = searchParams.get('model') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  let query = supabase
    .from('qual_defects')
    .select('*', { count: 'exact' })

  if (year) query = query.eq('year', parseInt(year))
  if (month) query = query.eq('month', parseInt(month))
  if (model) query = query.eq('model_name', model)

  if (search) {
    query = query.or(
      `snk_analysis.ilike.%${search}%,changmyung_analysis.ilike.%${search}%,model_name.ilike.%${search}%,branch_name.ilike.%${search}%,tag_content.ilike.%${search}%,remarks.ilike.%${search}%,daesung_no.ilike.%${search}%`
    )
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('no', { ascending: true })
    .range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, total: count })
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  const body = await request.json()

  if (Array.isArray(body)) {
    const { data, error } = await supabase.from('qual_defects').insert(body).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, count: data.length })
  }

  const { data, error } = await supabase.from('qual_defects').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
