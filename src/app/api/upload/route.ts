import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const year = parseInt(formData.get('year') as string)
  const month = parseInt(formData.get('month') as string)

  if (!file || !year || !month) {
    return NextResponse.json({ error: '파일, 연도, 월을 모두 입력해주세요.' }, { status: 400 })
  }

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, { header: 1 })

    // 헤더 행 찾기 (NO가 있는 행)
    let headerRowIndex = -1
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const row = rows[i]
      if (Array.isArray(row) && row.some(cell => String(cell).trim() === 'NO')) {
        headerRowIndex = i
        break
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json({ error: '헤더 행(NO)을 찾을 수 없습니다.' }, { status: 400 })
    }

    const headerRow = rows[headerRowIndex].map(cell => String(cell || '').trim())

    // 컬럼 인덱스 매핑 (유연하게)
    const findCol = (keywords: string[]) => {
      return headerRow.findIndex(h =>
        keywords.some(k => h.includes(k))
      )
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

    // 대성 No. 컬럼이 '지점명' 다음에 오는지 확인
    let actualDaesung = colDaesung
    if (actualDaesung === colBranch) {
      // 같은 인덱스면 다음 컬럼 시도
      actualDaesung = headerRow.findIndex((h, i) => i > colBranch && (h.includes('대성') || h.includes('No.')))
    }

    const defects = []
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i]
      if (!Array.isArray(row) || row.length === 0) continue

      const no = colNo >= 0 ? row[colNo] : null
      // 데이터 행인지 확인 (NO가 숫자인 행만)
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

    if (defects.length === 0) {
      return NextResponse.json({ error: '파싱된 데이터가 없습니다.' }, { status: 400 })
    }

    // Supabase에 배치 삽입 (1000건씩)
    const supabase = getSupabase()
    let insertedCount = 0
    for (let i = 0; i < defects.length; i += 1000) {
      const batch = defects.slice(i, i + 1000)
      const { error } = await supabase.from('qual_defects').insert(batch)
      if (error) {
        return NextResponse.json({
          error: `데이터 삽입 오류: ${error.message}`,
          inserted: insertedCount
        }, { status: 500 })
      }
      insertedCount += batch.length
    }

    return NextResponse.json({
      count: insertedCount,
      preview: defects.slice(0, 5),
    })
  } catch (err) {
    return NextResponse.json({
      error: `파일 처리 오류: ${err instanceof Error ? err.message : String(err)}`
    }, { status: 500 })
  }
}
