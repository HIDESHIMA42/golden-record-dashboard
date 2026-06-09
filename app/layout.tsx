import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: '株式会社ゴールデンレコード｜AI財務参謀',
  description: 'MMOL Finance Agent ダッシュボード',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, background: '#f5f6fa' }}>{children}</body>
    </html>
  );
}
