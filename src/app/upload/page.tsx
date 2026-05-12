"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [yearMonth, setYearMonth] = useState({ year: "", month: "" });
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStatus("idle");
      setMessage("");
      setPreview([]);
    }
  };

  const handleUpload = async () => {
    if (!file || !yearMonth.year || !yearMonth.month) {
      setMessage("파일과 연도/월을 선택해주세요.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setMessage("파일을 파싱하고 업로드 중...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", yearMonth.year);
    formData.append("month", yearMonth.month);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(`${data.count}건의 데이터가 성공적으로 업로드되었습니다.`);
        if (data.preview) setPreview(data.preview);
      } else {
        setStatus("error");
        setMessage(data.error || "업로드 중 오류가 발생했습니다.");
      }
    } catch {
      setStatus("error");
      setMessage("서버 연결에 실패했습니다.");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">데이터 업로드</h2>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">엑셀 파일 업로드 안내</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>CMST LIST 형식의 엑셀(.xlsx) 파일을 업로드해주세요</li>
            <li>헤더 행(NO, 주차, 기종명 등)이 포함된 파일이어야 합니다</li>
            <li>동일 연월 데이터가 이미 있으면 중복 추가됩니다</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
            <select
              value={yearMonth.year}
              onChange={(e) => setYearMonth({ ...yearMonth, year: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
            <select
              value={yearMonth.month}
              onChange={(e) => setYearMonth({ ...yearMonth, month: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">엑셀 파일</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="w-full border rounded px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:text-blue-700"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={status === "uploading"}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {status === "uploading" ? "업로드 중..." : "업로드"}
        </button>

        {message && (
          <div
            className={`p-3 rounded text-sm ${
              status === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : status === "error"
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-gray-50 text-gray-800"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">업로드된 데이터 미리보기 (상위 5건)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-2">기종명</th>
                  <th className="py-2 px-2">SNK 분석결과</th>
                  <th className="py-2 px-2">창명분석</th>
                  <th className="py-2 px-2 text-right">합계</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 px-2">{String(row.model_name || "")}</td>
                    <td className="py-2 px-2">{String(row.snk_analysis || "")}</td>
                    <td className="py-2 px-2">{String(row.changmyung_analysis || "")}</td>
                    <td className="py-2 px-2 text-right">{Number(row.total_cost || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
