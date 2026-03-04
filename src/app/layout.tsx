import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MediChecker - 의료광고법 AI 준수 검증',
  description: '의료광고법(의료법 제56조) 위반 여부를 AI로 자동 검증하는 사전검증 도구',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
