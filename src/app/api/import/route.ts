import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await request.json()

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: '배열 형태의 데이터가 필요합니다.' }, { status: 400 })
    }

    let insertedCount = 0
    const batchSize = 500

    for (let i = 0; i < body.length; i += batchSize) {
      const batch = body.slice(i, i + batchSize)
      const { error } = await supabase.from('qual_defects').insert(batch)
      if (error) {
        return NextResponse.json({
          error: `삽입 오류 (${insertedCount}건 삽입 후): ${error.message}`,
          inserted: insertedCount,
        }, { status: 500 })
      }
      insertedCount += batch.length
    }

    return NextResponse.json({ count: insertedCount })
  } catch (err) {
    return NextResponse.json({
      error: `처리 오류: ${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 })
  }
}

export async function DELETE() {
  const supabase = getSupabase()
  const { error } = await supabase.from('qual_defects').delete().gte('id', 0)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
