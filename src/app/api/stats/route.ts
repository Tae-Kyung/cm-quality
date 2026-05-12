import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabase()
  // 전체 통계
  const { data: allData, error } = await supabase
    .from('qual_defects')
    .select('year, month, model_name, snk_analysis, changmyung_analysis, total_cost')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const totalCount = allData.length
  const totalCost = allData.reduce((sum, d) => sum + (d.total_cost || 0), 0)

  // 연도별 통계
  const yearMap = new Map<number, { count: number; cost: number }>()
  allData.forEach(d => {
    const entry = yearMap.get(d.year) || { count: 0, cost: 0 }
    entry.count++
    entry.cost += d.total_cost || 0
    yearMap.set(d.year, entry)
  })
  const byYear = Array.from(yearMap.entries())
    .map(([year, v]) => ({ year, ...v }))
    .sort((a, b) => a.year - b.year)

  // 기종별 통계
  const modelMap = new Map<string, number>()
  allData.forEach(d => {
    const model = d.model_name || '미분류'
    modelMap.set(model, (modelMap.get(model) || 0) + 1)
  })
  const byModel = Array.from(modelMap.entries())
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)

  // 월별 통계
  const monthMap = new Map<string, number>()
  allData.forEach(d => {
    const key = `${d.year}-${d.month}`
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  })
  const byMonth = Array.from(monthMap.entries())
    .map(([key, count]) => {
      const [year, month] = key.split('-').map(Number)
      return { year, month, count }
    })
    .sort((a, b) => a.year - b.year || a.month - b.month)

  // 분석결과 TOP
  const analysisMap = new Map<string, number>()
  allData.forEach(d => {
    const analysis = d.snk_analysis?.trim()
    if (analysis && analysis !== '-' && analysis !== 'X') {
      analysisMap.set(analysis, (analysisMap.get(analysis) || 0) + 1)
    }
  })
  const topAnalysis = Array.from(analysisMap.entries())
    .map(([analysis, count]) => ({ analysis, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return NextResponse.json({
    totalCount,
    totalCost,
    byYear,
    byModel,
    byMonth,
    topAnalysis,
  })
}
