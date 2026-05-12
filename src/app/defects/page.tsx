"use client";

import { useEffect, useState, useCallback } from "react";
import type { Defect } from "@/types/database";

export default function DefectsPage() {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [model, setModel] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [years, setYears] = useState<number[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Defect>>({});

  useEffect(() => {
    fetch("/api/filters")
      .then((res) => res.json())
      .then((data) => {
        setYears(data.years || []);
        setModels(data.models || []);
      });
  }, []);

  const fetchDefects = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (year) params.set("year", year);
    if (month) params.set("month", month);
    if (model) params.set("model", model);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    fetch(`/api/defects?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setDefects(data.data || []);
        setTotal(data.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, year, month, model, page]);

  useEffect(() => {
    fetchDefects();
  }, [fetchDefects]);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDefects();
  };

  const handleEdit = (defect: Defect) => {
    setEditingId(defect.id);
    setEditData({ ...defect });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/defects/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      setEditingId(null);
      fetchDefects();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/defects/${id}`, { method: "DELETE" });
    if (res.ok) fetchDefects();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">불량 데이터</h2>
        <span className="text-sm text-gray-500">
          총 {total.toLocaleString()}건
        </span>
      </div>

      {/* 검색/필터 */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">검색어</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="분석결과, 기종명, 지점명 등..."
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">연도</label>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">월</label>
            <select
              value={month}
              onChange={(e) => { setMonth(e.target.value); setPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">기종</label>
            <select
              value={model}
              onChange={(e) => { setModel(e.target.value); setPage(1); }}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch(""); setYear(""); setMonth(""); setModel(""); setPage(1);
            }}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
          >
            초기화
          </button>
        </div>
      </form>

      {/* 데이터 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-3 text-left font-medium text-gray-600">연월</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">NO</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">주차</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">기종명</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">지점명</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">대성 No.</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">TAG 내용</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">SNK 분석결과</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">창명분석</th>
              <th className="py-3 px-3 text-right font-medium text-gray-600">합계</th>
              <th className="py-3 px-3 text-left font-medium text-gray-600">비고</th>
              <th className="py-3 px-3 text-center font-medium text-gray-600">관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-gray-500">
                  로딩 중...
                </td>
              </tr>
            ) : defects.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-gray-500">
                  데이터가 없습니다
                </td>
              </tr>
            ) : (
              defects.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  {editingId === d.id ? (
                    <>
                      <td className="py-2 px-3">{d.year}.{String(d.month).padStart(2, "0")}</td>
                      <td className="py-2 px-3">{d.no}</td>
                      <td className="py-2 px-3">{d.week_number}</td>
                      <td className="py-2 px-3">
                        <input className="border rounded px-1 py-0.5 w-20 text-xs" value={editData.model_name || ""} onChange={(e) => setEditData({ ...editData, model_name: e.target.value })} />
                      </td>
                      <td className="py-2 px-3">
                        <input className="border rounded px-1 py-0.5 w-20 text-xs" value={editData.branch_name || ""} onChange={(e) => setEditData({ ...editData, branch_name: e.target.value })} />
                      </td>
                      <td className="py-2 px-3">
                        <input className="border rounded px-1 py-0.5 w-24 text-xs" value={editData.daesung_no || ""} onChange={(e) => setEditData({ ...editData, daesung_no: e.target.value })} />
                      </td>
                      <td className="py-2 px-3">
                        <input className="border rounded px-1 py-0.5 w-20 text-xs" value={editData.tag_content || ""} onChange={(e) => setEditData({ ...editData, tag_content: e.target.value })} />
                      </td>
                      <td className="py-2 px-3">
                        <input className="border rounded px-1 py-0.5 w-28 text-xs" value={editData.snk_analysis || ""} onChange={(e) => setEditData({ ...editData, snk_analysis: e.target.value })} />
                      </td>
                      <td className="py-2 px-3">
                        <input className="border rounded px-1 py-0.5 w-28 text-xs" value={editData.changmyung_analysis || ""} onChange={(e) => setEditData({ ...editData, changmyung_analysis: e.target.value })} />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input className="border rounded px-1 py-0.5 w-16 text-xs text-right" type="number" value={editData.total_cost || 0} onChange={(e) => setEditData({ ...editData, total_cost: parseInt(e.target.value) || 0 })} />
                      </td>
                      <td className="py-2 px-3">
                        <input className="border rounded px-1 py-0.5 w-20 text-xs" value={editData.remarks || ""} onChange={(e) => setEditData({ ...editData, remarks: e.target.value })} />
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button onClick={handleSave} className="text-green-600 hover:underline text-xs mr-2">저장</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:underline text-xs">취소</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-3 whitespace-nowrap">{d.year}.{String(d.month).padStart(2, "0")}</td>
                      <td className="py-2 px-3">{d.no}</td>
                      <td className="py-2 px-3">{d.week_number}</td>
                      <td className="py-2 px-3">{d.model_name}</td>
                      <td className="py-2 px-3">{d.branch_name}</td>
                      <td className="py-2 px-3 text-xs">{d.daesung_no}</td>
                      <td className="py-2 px-3">{d.tag_content}</td>
                      <td className="py-2 px-3">{d.snk_analysis}</td>
                      <td className="py-2 px-3">{d.changmyung_analysis}</td>
                      <td className="py-2 px-3 text-right">{d.total_cost?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-xs text-gray-500">{d.remarks}</td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button onClick={() => handleEdit(d)} className="text-blue-600 hover:underline text-xs mr-2">수정</button>
                        <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:underline text-xs">삭제</button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-100"
          >
            이전
          </button>
          {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 5, totalPages - 9));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 border rounded text-sm ${
                  p === page ? "bg-blue-600 text-white" : "hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
