/**
 * freeeのrefresh_tokenをVercel KVに保存するスクリプト
 * 使い方: node scripts/push-token.js <refresh_token>
 * 例: node scripts/push-token.js DyULhRWIPAuwbUMwinLYrTuY042wn6BtjUe_6F5Ek9s
 */

const CLIENT_SECRET = 'm3xF7IWJw20G8Grf_E3ibx9_guNcV9cgjjy-ncUS599j3ki0uXzP0Rw48Keqc96ZUk-s19so-v4t5ldKgl64_g';
const VERCEL_URL = 'https://golden-record-dashboard.vercel.app';

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error('使い方: node scripts/push-token.js <refresh_token>');
    process.exit(1);
  }

  console.log('Vercel KVにトークンを保存中...');

  const res = await fetch(`${VERCEL_URL}/api/admin/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, secret: CLIENT_SECRET }),
  });

  const data = await res.json();

  if (data.ok) {
    console.log('✅ 成功！');
    console.log('');
    console.log('ダッシュボードを開いてください:');
    console.log(VERCEL_URL);
  } else {
    console.error('❌ 失敗:', data);
    process.exit(1);
  }
}

main().catch(console.error);
