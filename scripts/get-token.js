/**
 * freee OAuthトークン取得スクリプト（初回のみ実行）
 * 使い方: node scripts/get-token.js
 */

const http    = require('http');
const { exec } = require('child_process');

const CLIENT_ID     = '743790946263976';
const CLIENT_SECRET = 'm3xF7IWJw20G8Grf_E3ibx9_guNcV9cgjjy-ncUS599j3ki0uXzP0Rw48Keqc96ZUk-s19so-v4t5ldKgl64_g';
const REDIRECT_URI  = 'http://localhost:3000/callback';
const TOKEN_URL     = 'https://accounts.secure.freee.co.jp/public_api/token';

const AUTH_URL =
  `https://accounts.secure.freee.co.jp/public_api/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&prompt=select_company`;

console.log('\n========================================');
console.log('  freee アクセストークン取得スクリプト');
console.log('========================================\n');
console.log('ブラウザが自動で開きます。freeeにログインして許可してください...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  if (url.pathname !== '/callback') {
    res.end('waiting...');
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400);
    res.end('認証コードが取得できませんでした。');
    server.close();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h2>✅ 認証成功！ターミナルに戻ってください。</h2><p>このタブは閉じて大丈夫です。</p>');

  console.log('認証コード取得成功。トークンを交換中...\n');
  server.close();

  try {
    const params = new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri:  REDIRECT_URI,
    });
    console.log('送信パラメータ:', params.toString());
    const tokenRes = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await tokenRes.json();

    if (!data.refresh_token) {
      console.error('❌ エラー:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ トークン取得成功！\n');
    console.log('========================================');
    console.log('  以下を Vercel の環境変数に設定してください');
    console.log('========================================\n');
    console.log(`FREEE_CLIENT_ID=${CLIENT_ID}`);
    console.log(`FREEE_CLIENT_SECRET=${CLIENT_SECRET}`);
    console.log(`FREEE_REFRESH_TOKEN=${data.refresh_token}`);
    console.log(`FREEE_COMPANY_ID=11590903`);
    console.log('\n⚠️  これらの値はGitHubには絶対にコミットしないでください。');

  } catch (err) {
    console.error('❌ 通信エラー:', err.message);
    process.exit(1);
  }
});

server.listen(3000, () => {
  // ブラウザを自動で開く
  exec(`open "${AUTH_URL}"`);
  console.log(`ブラウザが開かない場合は以下のURLを手動で開いてください:\n${AUTH_URL}\n`);
});
