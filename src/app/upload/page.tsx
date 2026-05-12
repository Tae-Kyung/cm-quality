"use client";

import { useState } from "react";

interface UploadResult {
  filename: string;
  count: number;
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [yearMonth, setYearMonth] = useState({ year: "", month: "" });
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<UploadResult[]>([]);

  // 전체 삭제
  const [deleting, setDeleting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    setStatus("idle");
    setMessage("");
    setResults([]);
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setMessage("파일을 선택해주세요.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setMessage(`${files.length}개 파일 업로드 중...`);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    if (yearMonth.year) formData.append("year", yearMonth.year);
    if (yearMonth.month) formData.append("month", yearMonth.month);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(`총 ${data.totalCount}건의 데이터가 업로드되었습니다.`);
        setResults(data.results || []);
      } else {
        setStatus("error");
        setMessage(data.error || "업로드 중 오류가 발생했습니다.");
      }
    } catch {
      setStatus("error");
      setMessage("서버 연결에 실패했습니다.");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("정말 전체 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;
    if (!confirm("한번 더 확인합니다. 모든 불량 데이터가 삭제됩니다. 계속하시겠습니까?")) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/import", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("전체 데이터가 삭제되었습니다.");
      } else {
        alert(`삭제 실패: ${data.error}`);
      }
    } catch {
      alert("서버 연결에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">데이터 업로드</h2>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">엑셀 파일 업로드 안내</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>CMST LIST 형식의 엑셀(.xlsx) 파일을 여러 개 선택할 수 있습니다</li>
            <li>파일명에 &quot;2025년 3월&quot; 형식이 있으면 연도/월이 자동 추출됩니다</li>
            <li>자동 추출이 안 되는 경우 아래에서 연도/월을 선택해주세요</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">엑셀 파일 (여러 개 선택 가능)</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            multiple
            onChange={handleFileChange}
            className="w-full border rounded px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:text-blue-700"
          />
          {files && files.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{files.length}개 파일 선택됨</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">연도 (파일명 자동추출 실패 시)</label>
            <select
              value={yearMonth.year}
              onChange={(e) => setYearMonth({ ...yearMonth, year: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">자동</option>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월 (파일명 자동추출 실패 시)</label>
            <select
              value={yearMonth.month}
              onChange={(e) => setYearMonth({ ...yearMonth, month: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="">자동</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
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

      {/* 파일별 업로드 결과 */}
      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">업로드 결과</h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded text-sm ${
                  r.error
                    ? "bg-red-50 border border-red-200"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <span className="font-medium truncate mr-4">{r.filename}</span>
                {r.error ? (
                  <span className="text-red-700 text-xs shrink-0">{r.error}</span>
                ) : (
                  <span className="text-green-700 shrink-0">{r.count}건 등록</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 삭제 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2 text-red-700">데이터 관리</h3>
        <p className="text-sm text-gray-500 mb-4">
          전체 불량 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <button
          onClick={handleDeleteAll}
          disabled={deleting}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "전체 데이터 삭제"}
        </button>
      </div>
    </div>
  );
}
