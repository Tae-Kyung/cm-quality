"use client";

import { useEffect, useState } from "react";
import type { DefectStats } from "@/types/database";

export default function Dashboard() {
  const [stats, setStats] = useState<DefectStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">데이터가 없습니다</h2>
        <p className="text-gray-500">
          먼저 <a href="/upload" className="text-blue-600 underline">데이터 업로드</a> 페이지에서 엑셀 파일을 업로드해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">대시보드</h2>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">총 불량 건수</p>
          <p className="text-3xl font-bold text-red-600 mt-1">
            {stats.totalCount.toLocaleString()}건
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">총 클레임 비용</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">
            {stats.totalCost.toLocaleString()}원
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">기종 수</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {stats.byModel.length}종
          </p>
        </div>
      </div>

      {/* 연도별 통계 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">연도별 불량 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3">연도</th>
                <th className="py-2 px-3 text-right">불량 건수</th>
                <th className="py-2 px-3 text-right">클레임 비용</th>
                <th className="py-2 px-3">비율</th>
              </tr>
            </thead>
            <tbody>
              {stats.byYear.map((row) => (
                <tr key={row.year} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium">{row.year}년</td>
                  <td className="py-2 px-3 text-right">{row.count.toLocaleString()}건</td>
                  <td className="py-2 px-3 text-right">{row.cost.toLocaleString()}원</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(row.count / stats.totalCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {((row.count / stats.totalCount) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기종별 통계 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">기종별 불량 현황</h3>
          <div className="space-y-3">
            {stats.byModel.slice(0, 10).map((row) => (
              <div key={row.model} className="flex items-center gap-3">
                <span className="text-sm w-24 font-medium truncate">{row.model}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{
                      width: `${(row.count / stats.byModel[0].count) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{row.count}건</span>
              </div>
            ))}
          </div>
        </div>

        {/* SNK 분석결과 TOP 10 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">불량 유형 TOP 10</h3>
          <div className="space-y-3">
            {stats.topAnalysis.map((row, i) => (
              <div key={row.analysis} className="flex items-center gap-3">
                <span className="text-sm bg-gray-100 rounded px-2 py-0.5 w-6 text-center">
                  {i + 1}
                </span>
                <span className="text-sm flex-1 truncate">{row.analysis}</span>
                <span className="text-sm text-gray-600 w-12 text-right">{row.count}건</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 월별 추이 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">월별 불량 추이</h3>
        {(() => {
          const maxCount = Math.max(...stats.byMonth.map((m) => m.count), 1);
          const years = [...new Set(stats.byMonth.map((m) => m.year))];
          const yearColors: Record<number, string> = {};
          const colorList = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500"];
          years.forEach((y, i) => { yearColors[y] = colorList[i % colorList.length]; });
          const gridLines = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(maxCount * r));

          return (
            <>
              {/* 범례 */}
              <div className="flex gap-4 mb-3">
                {years.map((y) => (
                  <div key={y} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className={`inline-block w-3 h-3 rounded ${yearColors[y]}`} />
                    {y}년
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto">
                <div className="relative min-w-[700px]">
                  {/* Y축 그리드 */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ bottom: "32px" }}>
                    {gridLines.reverse().map((v, i) => (
                      <div key={i} className="flex items-center">
                        <span className="text-[10px] text-gray-400 w-8 text-right pr-2">{v}</span>
                        <div className="flex-1 border-t border-gray-100" />
                      </div>
                    ))}
                  </div>

                  {/* 바 차트 */}
                  <div className="flex items-end gap-[3px] pl-9" style={{ height: "200px", paddingBottom: "32px" }}>
                    {stats.byMonth.map((row, idx) => {
                      const height = (row.count / maxCount) * 100;
                      const isYearStart = idx === 0 || stats.byMonth[idx - 1].year !== row.year;
                      return (
                        <div
                          key={`${row.year}-${row.month}`}
                          className={`flex-1 flex flex-col items-center justify-end ${isYearStart && idx > 0 ? "ml-2" : ""}`}
                          style={{ height: "100%" }}
                        >
                          {/* 건수 라벨 */}
                          <span className="text-[10px] font-medium text-gray-600 mb-0.5">
                            {row.count}
                          </span>
                          {/* 바 */}
                          <div
                            className={`w-full rounded-t ${yearColors[row.year]} transition-all min-h-[3px]`}
                            style={{ height: `${height}%` }}
                            title={`${row.year}년 ${row.month}월: ${row.count}건`}
                          />
                          {/* X축 라벨 */}
                          <span className="text-[10px] text-gray-500 mt-1 leading-none">
                            {row.month}월
                          </span>
                          {isYearStart && (
                            <span className="text-[9px] text-gray-400 leading-none">
                              {row.year}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
