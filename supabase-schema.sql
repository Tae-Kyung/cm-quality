-- Supabase SQL Editor에서 실행할 스키마

-- 불량 데이터 테이블
CREATE TABLE qual_defects (
  id BIGSERIAL PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL,
  no INT,
  week_number INT,
  manufacture_date TEXT,
  model_name TEXT,
  branch_name TEXT,
  daesung_no TEXT,
  tag_content TEXT,
  snk_analysis TEXT,
  changmyung_analysis TEXT,
  product_price INT DEFAULT 0,
  injection_cost INT DEFAULT 0,
  claim_cost INT DEFAULT 0,
  total_cost INT DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_qual_defects_year_month ON qual_defects(year, month);
CREATE INDEX idx_qual_defects_model_name ON qual_defects(model_name);
CREATE INDEX idx_qual_defects_snk_analysis ON qual_defects(snk_analysis);
CREATE INDEX idx_qual_defects_changmyung_analysis ON qual_defects(changmyung_analysis);
CREATE INDEX idx_qual_defects_branch_name ON qual_defects(branch_name);

-- Full text search를 위한 인덱스
CREATE INDEX idx_qual_defects_search ON qual_defects USING GIN (
  to_tsvector('simple', COALESCE(model_name, '') || ' ' || COALESCE(snk_analysis, '') || ' ' || COALESCE(changmyung_analysis, '') || ' ' || COALESCE(branch_name, '') || ' ' || COALESCE(tag_content, '') || ' ' || COALESCE(remarks, ''))
);

-- RLS 정책 (공개 읽기)
ALTER TABLE qual_defects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON qual_defects
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON qual_defects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON qual_defects
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON qual_defects
  FOR DELETE USING (true);
