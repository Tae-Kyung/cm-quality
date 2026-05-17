import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// 주차코드(예: 2351)를 Date로 변환 (23년 51주차 → 2023년 51주차의 월요일)
function weekCodeToDate(weekCode: number): Date | null {
  if (!weekCode || weekCode < 1000 || weekCode > 9999) return null
  const yearPart = Math.floor(weekCode / 100)
  const weekPart = weekCode % 100
  if (weekPart < 1 || weekPart > 53) return null
  const fullYear = yearPart < 50 ? 2000 + yearPart : 1900 + yearPart

  // ISO 주차 기준: 1월 4일이 포함된 주가 1주차
  const jan4 = new Date(fullYear, 0, 4)
  const dayOfWeek = jan4.getDay() || 7 // 일요일=7
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - dayOfWeek + 1)

  const targetDate = new Date(week1Monday)
  targetDate.setDate(week1Monday.getDate() + (weekPart - 1) * 7)
  return targetDate
}

// 두 날짜 사이의 개월 수 차이 계산
function monthsDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('qual_defects')
    .select('year, month, week_number, model_name, snk_analysis')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  interface LeadTimeRecord {
    model: string
    snkAnalysis: string | null
    weekCode: number
    defectYear: number
    defectMonth: number
    manufactureDate: string
    leadTimeMonths: number
  }

  const records: LeadTimeRecord[] = []

  for (const d of data) {
    if (!d.week_number || !d.year || !d.month) continue
    const mfgDate = weekCodeToDate(d.week_number)
    if (!mfgDate) continue

    const defectDate = new Date(d.year, d.month - 1, 1)
    const leadTime = monthsDiff(mfgDate, defectDate)
    if (leadTime < 0) continue // 비정상 데이터 제외

    records.push({
      model: d.model_name || '미분류',
      snkAnalysis: d.snk_analysis?.trim() || null,
      weekCode: d.week_number,
      defectYear: d.year,
      defectMonth: d.month,
      manufactureDate: `${mfgDate.getFullYear()}.${mfgDate.getMonth() + 1}`,
      leadTimeMonths: leadTime,
    })
  }

  // 제품별 리드타임 통계
  const modelStats = new Map<string, { total: number; count: number; min: number; max: number; distribution: Map<number, number> }>()

  for (const r of records) {
    let stat = modelStats.get(r.model)
    if (!stat) {
      stat = { total: 0, count: 0, min: Infinity, max: -Infinity, distribution: new Map() }
      modelStats.set(r.model, stat)
    }
    stat.total += r.leadTimeMonths
    stat.count++
    stat.min = Math.min(stat.min, r.leadTimeMonths)
    stat.max = Math.max(stat.max, r.leadTimeMonths)
    stat.distribution.set(r.leadTimeMonths, (stat.distribution.get(r.leadTimeMonths) || 0) + 1)
  }

  const byModel = Array.from(modelStats.entries())
    .map(([model, stat]) => ({
      model,
      count: stat.count,
      avgMonths: Math.round((stat.total / stat.count) * 10) / 10,
      minMonths: stat.min === Infinity ? 0 : stat.min,
      maxMonths: stat.max === -Infinity ? 0 : stat.max,
      distribution: Array.from(stat.distribution.entries())
        .map(([months, count]) => ({ months, count }))
        .sort((a, b) => a.months - b.months),
    }))
    .sort((a, b) => b.count - a.count)

  // SNK 분석결과별 리드타임 통계
  const analysisStats = new Map<string, { total: number; count: number; min: number; max: number; distribution: Map<number, number> }>()

  for (const r of records) {
    const analysis = r.snkAnalysis
    if (!analysis || analysis === '-' || analysis === 'X') continue
    let stat = analysisStats.get(analysis)
    if (!stat) {
      stat = { total: 0, count: 0, min: Infinity, max: -Infinity, distribution: new Map() }
      analysisStats.set(analysis, stat)
    }
    stat.total += r.leadTimeMonths
    stat.count++
    stat.min = Math.min(stat.min, r.leadTimeMonths)
    stat.max = Math.max(stat.max, r.leadTimeMonths)
    stat.distribution.set(r.leadTimeMonths, (stat.distribution.get(r.leadTimeMonths) || 0) + 1)
  }

  const byAnalysis = Array.from(analysisStats.entries())
    .map(([analysis, stat]) => ({
      analysis,
      count: stat.count,
      avgMonths: Math.round((stat.total / stat.count) * 10) / 10,
      minMonths: stat.min === Infinity ? 0 : stat.min,
      maxMonths: stat.max === -Infinity ? 0 : stat.max,
      distribution: Array.from(stat.distribution.entries())
        .map(([months, count]) => ({ months, count }))
        .sort((a, b) => a.months - b.months),
    }))
    .sort((a, b) => b.count - a.count)

  // 전체 리드타임 분포
  const overallDist = new Map<number, number>()
  for (const r of records) {
    overallDist.set(r.leadTimeMonths, (overallDist.get(r.leadTimeMonths) || 0) + 1)
  }
  const overallDistribution = Array.from(overallDist.entries())
    .map(([months, count]) => ({ months, count }))
    .sort((a, b) => a.months - b.months)

  // 전체 평균
  const totalLeadTime = records.reduce((s, r) => s + r.leadTimeMonths, 0)
  const avgLeadTime = records.length > 0 ? Math.round((totalLeadTime / records.length) * 10) / 10 : 0

  return NextResponse.json({
    totalRecords: records.length,
    avgLeadTimeMonths: avgLeadTime,
    overallDistribution,
    byModel,
    byAnalysis,
  })
}
