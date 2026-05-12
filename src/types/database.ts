export interface Defect {
  id: number
  year: number
  month: number
  no: number | null
  week_number: number | null
  manufacture_date: string | null
  model_name: string | null
  branch_name: string | null
  daesung_no: string | null
  tag_content: string | null
  snk_analysis: string | null
  changmyung_analysis: string | null
  product_price: number
  injection_cost: number
  claim_cost: number
  total_cost: number
  remarks: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      qual_defects: {
        Row: Defect
        Insert: Omit<Defect, 'id' | 'created_at'>
        Update: Partial<Omit<Defect, 'id' | 'created_at'>>
      }
    }
  }
}

export interface DefectFilters {
  search: string
  year: string
  month: string
  model: string
  page: number
  pageSize: number
}

export interface DefectStats {
  totalCount: number
  totalCost: number
  byYear: { year: number; count: number; cost: number }[]
  byModel: { model: string; count: number }[]
  byMonth: { year: number; month: number; count: number }[]
  topAnalysis: { analysis: string; count: number }[]
}
