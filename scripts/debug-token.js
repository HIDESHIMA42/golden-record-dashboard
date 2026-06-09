/**
 * freee OAuth デバッグスクリプト
 * 使い方: node scripts/debug-token.js
 */

const http  = require('http');
const https = require('https');
const { exec } = require('child_process');

const CLIENT_ID     = '743790946263976';
const CLIENT_SECRET = 'm3xF7IWJw20G8Grf_E3ibx9_guNcV9cgjjy-ncUS599j3ki0uXzP0Rw48Keqc96ZUk-s19so-v4t5ldKgl64_g';
const REDIRECT_URI  = 'http://localhost:3000/callback';

const AUTH_URL =
  `https://accounts.secure.freee.co.jp/public_api/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&prompt=select_company`;

function exchangeToken(code) {
  return new Promise((resolve, reject) => {
    const body = [
      `grant_type=authorization_code`,
      `client_id=${encodeURIComponent(CLIENT_ID)}`,
      `client_secret=${encodeURIComponent(CLIENT_SECRET)}`,
      `code=${encodeURIComponent(code)}`,
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    ].join('&');

    console.log('\n--- リクエスト詳細 ---');
    console.log('URL: https://accounts.secure.freee.co.jp/public_api/token');
    console.log('Body:', body);

    const options = {
      hostname: 'accounts.secure.freee.co.jp',
      path: '/public_api/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'Accept': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      console.log('\n--- レスポンス詳細 ---');
      console.log('ステータス:', res.statusCode, res.statusMessage);
      console.log('ヘッダー:', JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('ボディ:', data);
        try { resolve(JSON.parse(data)); }
        catch { resolve(data); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

console.log('\n========================================');
console.log('  freee OAuth デバッグスクリプト');
console.log('========================================\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  if (url.pathname !== '/callback') { res.end('waiting...'); return; }

  const code  = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<h2>認証完了。ターミナルを確認してください。</h2>');
  server.close();

  if (error) {
    console.error('認証エラー:', error, url.searchParams.get('error_description'));
    process.exit(1);
  }

  console.log('\n✅ 認証コード取得:', code);
  console.log('コードの長さ:', code?.length);

  const result = await exchangeToken(code).catch(e => { console.error('通信エラー:', e); process.exit(1); });

  if (result.refresh_token) {
    console.log('\n🎉 成功！\n');
    console.log('FREEE_CLIENT_ID=' + CLIENT_ID);
    console.log('FREEE_CLIENT_SECRET=' + CLIENT_SECRET);
    console.log('FREEE_REFRESH_TOKEN=' + result.refresh_token);
    console.log('FREEE_COMPANY_ID=11590903');
  } else {
    console.log('\n❌ トークン取得失敗。上記のレスポンス詳細を確認してください。');
  }
});

server.listen(3000, () => {
  console.log('ブラウザを自動で開きます...\n');
  exec(`open "${AUTH_URL}"`);
});
