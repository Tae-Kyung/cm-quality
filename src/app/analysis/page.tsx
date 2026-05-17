"use client";

import { useEffect, useState } from "react";

interface Distribution {
  months: number;
  count: number;
}

interface ModelStat {
  model: string;
  count: number;
  avgMonths: number;
  minMonths: number;
  maxMonths: number;
  distribution: Distribution[];
}

interface AnalysisStat {
  analysis: string;
  count: number;
  avgMonths: number;
  minMonths: number;
  maxMonths: number;
  distribution: Distribution[];
}

interface LeadTimeData {
  totalRecords: number;
  avgLeadTimeMonths: number;
  overallDistribution: Distribution[];
  byModel: ModelStat[];
  byAnalysis: AnalysisStat[];
}

export default function AnalysisPage() {
  const [data, setData] = useState<LeadTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lead-time")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">분석 데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!data || data.totalRecords === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">분석할 데이터가 없습니다</h2>
        <p className="text-gray-500">주차 정보가 있는 불량 데이터가 필요합니다.</p>
      </div>
    );
  }

  const activeModel = selectedModel ? data.byModel.find((m) => m.model === selectedModel) : null;
  const activeAnalysis = selectedAnalysis ? data.byAnalysis.find((a) => a.analysis === selectedAnalysis) : null;
  const activeDistribution = activeModel
    ? activeModel.distribution
    : activeAnalysis
      ? activeAnalysis.distribution
      : data.overallDistribution;
  const activeMaxCount = Math.max(...activeDistribution.map((d) => d.count), 1);
  const activeLabel = activeModel
    ? `${activeModel.model} 리드타임 분포`
    : activeAnalysis
      ? `${activeAnalysis.analysis} 리드타임 분포`
      : "전체 리드타임 분포";
  const activeStat = activeModel || activeAnalysis;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">제조~불량 리드타임 분석</h2>
      <p className="text-sm text-gray-500 -mt-4">
        제조 주차(예: 2351 = 23년 51주)로부터 불량 발생월까지의 소요 기간을 분석합니다.
      </p>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">분석 대상 건수</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {data.totalRecords.toLocaleString()}건
          </p>
          <p className="text-xs text-gray-400 mt-1">주차 정보가 있는 불량 건</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">평균 리드타임</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">
            {data.avgLeadTimeMonths}개월
          </p>
          <p className="text-xs text-gray-400 mt-1">제조 ~ 불량 발생까지</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">분석 기종 수</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {data.byModel.length}종
          </p>
        </div>
      </div>

      {/* 리드타임 분포 차트 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{activeLabel}</h3>
          {(selectedModel || selectedAnalysis) && (
            <button
              onClick={() => { setSelectedModel(null); setSelectedAnalysis(null); }}
              className="text-sm text-blue-600 hover:underline"
            >
              전체 보기
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-1 min-w-[600px]" style={{ height: "220px", paddingBottom: "40px" }}>
            {activeDistribution.map((d) => {
              const height = (d.count / activeMaxCount) * 100;
              return (
                <div
                  key={d.months}
                  className="flex-1 flex flex-col items-center justify-end"
                  style={{ height: "100%" }}
                >
                  <span className="text-[10px] font-medium text-gray-600 mb-0.5">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t bg-blue-500 transition-all min-h-[3px]"
                    style={{ height: `${height}%` }}
                    title={`${d.months}개월: ${d.count}건`}
                  />
                  <span className="text-[10px] text-gray-500 mt-1">{d.months}개월</span>
                </div>
              );
            })}
          </div>
        </div>
        {activeStat && (
          <div className="mt-3 text-sm text-gray-500 flex gap-6">
            <span>평균: <strong>{activeStat.avgMonths}개월</strong></span>
            <span>최소: <strong>{activeStat.minMonths}개월</strong></span>
            <span>최대: <strong>{activeStat.maxMonths}개월</strong></span>
            <span>건수: <strong>{activeStat.count}건</strong></span>
          </div>
        )}
      </div>

      {/* 제품별 리드타임 테이블 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">제품(기종)별 리드타임 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3">기종</th>
                <th className="py-2 px-3 text-right">건수</th>
                <th className="py-2 px-3 text-right">평균(개월)</th>
                <th className="py-2 px-3 text-right">최소(개월)</th>
                <th className="py-2 px-3 text-right">최대(개월)</th>
                <th className="py-2 px-3">분포</th>
              </tr>
            </thead>
            <tbody>
              {data.byModel.map((m) => {
                const barMax = Math.max(...data.byModel.map((x) => x.avgMonths), 1);
                return (
                  <tr
                    key={m.model}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${selectedModel === m.model ? "bg-blue-50" : ""}`}
                    onClick={() => { setSelectedAnalysis(null); setSelectedModel(selectedModel === m.model ? null : m.model); }}
                  >
                    <td className="py-2 px-3 font-medium">{m.model}</td>
                    <td className="py-2 px-3 text-right">{m.count}건</td>
                    <td className="py-2 px-3 text-right font-semibold text-orange-600">
                      {m.avgMonths}
                    </td>
                    <td className="py-2 px-3 text-right text-green-600">{m.minMonths}</td>
                    <td className="py-2 px-3 text-right text-red-600">{m.maxMonths}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-40">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(m.avgMonths / barMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">행을 클릭하면 해당 기종의 리드타임 분포를 위 차트에서 확인할 수 있습니다.</p>
      </div>

      {/* SNK 분석결과별 리드타임 테이블 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">SNK 분석결과별 리드타임 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 px-3">분석결과</th>
                <th className="py-2 px-3 text-right">건수</th>
                <th className="py-2 px-3 text-right">평균(개월)</th>
                <th className="py-2 px-3 text-right">최소(개월)</th>
                <th className="py-2 px-3 text-right">최대(개월)</th>
                <th className="py-2 px-3">분포</th>
              </tr>
            </thead>
            <tbody>
              {data.byAnalysis.map((a) => {
                const barMax = Math.max(...data.byAnalysis.map((x) => x.avgMonths), 1);
                return (
                  <tr
                    key={a.analysis}
                    className={`border-b hover:bg-gray-50 cursor-pointer ${selectedAnalysis === a.analysis ? "bg-purple-50" : ""}`}
                    onClick={() => { setSelectedModel(null); setSelectedAnalysis(selectedAnalysis === a.analysis ? null : a.analysis); }}
                  >
                    <td className="py-2 px-3 font-medium">{a.analysis}</td>
                    <td className="py-2 px-3 text-right">{a.count}건</td>
                    <td className="py-2 px-3 text-right font-semibold text-purple-600">
                      {a.avgMonths}
                    </td>
                    <td className="py-2 px-3 text-right text-green-600">{a.minMonths}</td>
                    <td className="py-2 px-3 text-right text-red-600">{a.maxMonths}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-40">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${(a.avgMonths / barMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">행을 클릭하면 해당 불량 유형의 리드타임 분포를 위 차트에서 확인할 수 있습니다.</p>
      </div>
    </div>
  );
}
