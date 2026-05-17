import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "창명제어기술 품질관리 시스템",
  description: "불량 데이터 통합 검색 및 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <a href="/" className="text-xl font-bold text-gray-900">
                  창명제어기술
                </a>
                <span className="text-sm text-gray-500 border-l pl-3 border-gray-300">
                  품질관리 시스템
                </span>
              </div>
              <div className="flex gap-6 text-sm">
                <a href="/" className="text-gray-700 hover:text-blue-600 font-medium">
                  대시보드
                </a>
                <a href="/defects" className="text-gray-700 hover:text-blue-600 font-medium">
                  불량 데이터
                </a>
                <a href="/analysis" className="text-gray-700 hover:text-blue-600 font-medium">
                  리드타임 분석
                </a>
                <a href="/upload" className="text-gray-700 hover:text-blue-600 font-medium">
                  데이터 업로드
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
