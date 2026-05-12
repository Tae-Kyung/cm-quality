import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

function parseExcelFile(buffer: ArrayBuffer, year: number, month: number) {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1 })

  // 헤더 행 찾기
  let headerRowIndex = -1
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i]
    if (Array.isArray(row) && row.some(cell => cell != null && String(cell).trim() === 'NO')) {
      headerRowIndex = i
      break
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('헤더 행(NO)을 찾을 수 없습니다.')
  }

  const rawRow = rows[headerRowIndex]
  const headerRow: string[] = Array.from({ length: rawRow.length }, (_, i) => String(rawRow[i] ?? '').trim())

  const findCol = (keywords: string[]) => {
    return headerRow.findIndex(h => h !== '' && keywords.some(k => h.includes(k)))
  }

  const colNo = findCol(['NO'])
  const colWeek = findCol(['주'])
  const colManufDate = findCol(['년', '월', '년 월'])
  const colModel = findCol(['기종'])
  const colBranch = findCol(['지점', '점명'])
  const colDaesung = findCol(['대성', 'No.'])
  const colTag = findCol(['TAG'])
  const colSnk = findCol(['SNK', '분석결과'])
  const colChangmyung = findCol(['창명'])
  const colPrice = findCol(['제품', '단가'])
  const colInjection = findCol(['사출'])
  const colClaim = findCol(['클레임', '비용'])
  const colTotal = findCol(['합계', '합 계'])
  const colRemarks = findCol(['비고', '비 고'])

  let actualDaesung = colDaesung
  if (actualDaesung === colBranch) {
    actualDaesung = headerRow.findIndex((h, i) => i > colBranch && h !== '' && (h.includes('대성') || h.includes('No.')))
  }

  const defects = []
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!Array.isArray(row) || row.length === 0) continue

    const no = colNo >= 0 ? row[colNo] : null
    if (no === null || no === undefined || isNaN(Number(no))) continue

    const getValue = (idx: number): string | null => {
      if (idx < 0 || idx >= row.length) return null
      const val = row[idx]
      if (val === null || val === undefined) return null
      const s = String(val).trim()
      return s === '' || s === '-' ? null : s
    }

    const getNumber = (idx: number): number => {
      if (idx < 0 || idx >= row.length) return 0
      const val = row[idx]
      return typeof val === 'number' ? val : parseInt(String(val)) || 0
    }

    defects.push({
      year,
      month,
      no: Number(no),
      week_number: colWeek >= 0 ? getNumber(colWeek) : null,
      manufacture_date: colManufDate >= 0 ? getValue(colManufDate) : null,
      model_name: colModel >= 0 ? getValue(colModel) : null,
      branch_name: colBranch >= 0 ? getValue(colBranch) : null,
      daesung_no: actualDaesung >= 0 ? getValue(actualDaesung) : null,
      tag_content: colTag >= 0 ? getValue(colTag) : null,
      snk_analysis: colSnk >= 0 ? getValue(colSnk) : null,
      changmyung_analysis: colChangmyung >= 0 ? getValue(colChangmyung) : null,
      product_price: colPrice >= 0 ? getNumber(colPrice) : 0,
      injection_cost: colInjection >= 0 ? getNumber(colInjection) : 0,
      claim_cost: colClaim >= 0 ? getNumber(colClaim) : 0,
      total_cost: colTotal >= 0 ? getNumber(colTotal) : 0,
      remarks: colRemarks >= 0 ? getValue(colRemarks) : null,
    })
  }

  return defects
}

function extractYearMonth(filename: string): { year: number; month: number } | null {
  const match = filename.match(/(\d{4})년\s*(\d{1,2})월/)
  if (match) {
    return { year: parseInt(match[1]), month: parseInt(match[2]) }
  }
  return null
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const fallbackYear = formData.get('year') ? parseInt(formData.get('year') as string) : 0
  const fallbackMonth = formData.get('month') ? parseInt(formData.get('month') as string) : 0

  if (!files || files.length === 0) {
    return NextResponse.json({ error: '파일을 선택해주세요.' }, { status: 400 })
  }

  const supabase = getSupabase()
  const results: { filename: string; count: number; error?: string }[] = []
  let totalInserted = 0

  for (const file of files) {
    try {
      // 파일명에서 연월 자동 추출, 실패 시 폼에서 받은 값 사용
      const extracted = extractYearMonth(file.name)
      const year = extracted?.year || fallbackYear
      const month = extracted?.month || fallbackMonth

      if (!year || !month) {
        results.push({ filename: file.name, count: 0, error: '연도/월을 파일명에서 추출할 수 없습니다. 연도와 월을 선택해주세요.' })
        continue
      }

      const buffer = await file.arrayBuffer()
      const defects = parseExcelFile(buffer, year, month)

      if (defects.length === 0) {
        results.push({ filename: file.name, count: 0, error: '파싱된 데이터가 없습니다.' })
        continue
      }

      let insertedCount = 0
      for (let i = 0; i < defects.length; i += 1000) {
        const batch = defects.slice(i, i + 1000)
        const { error } = await supabase.from('qual_defects').insert(batch)
        if (error) {
          results.push({ filename: file.name, count: insertedCount, error: error.message })
          break
        }
        insertedCount += batch.length
      }

      if (!results.find(r => r.filename === file.name)) {
        results.push({ filename: file.name, count: insertedCount })
      }
      totalInserted += insertedCount
    } catch (err) {
      results.push({
        filename: file.name,
        count: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return NextResponse.json({ totalCount: totalInserted, results })
}
