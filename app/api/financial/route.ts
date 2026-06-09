import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const TOKEN_URL  = 'https://accounts.secure.freee.co.jp/public_api/token';
const API_BASE   = 'https://api.freee.co.jp';
const COMPANY_ID = process.env.FREEE_COMPANY_ID ?? '11590903';
const FISCAL_YEAR = '2025';
const KV_KEY = 'freee_refresh_token';

async function getAccessToken(): Promise<string> {
  // KVから最新のrefresh_tokenを取得（なければenv varを使用）
  const refreshToken = (await kv.get<string>(KV_KEY)) ?? process.env.FREEE_REFRESH_TOKEN ?? '';

  const params = new URLSearchParams({
    grant_type:    'refresh_token',
    client_id:     process.env.FREEE_CLIENT_ID ?? '',
    client_secret: process.env.FREEE_CLIENT_SECRET ?? '',
    refresh_token: refreshToken,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Token refresh failed: ' + JSON.stringify(data));
  }
  // 新しいrefresh_tokenをKVに保存（ローテーション対応）
  if (data.refresh_token) {
    await kv.set(KV_KEY, data.refresh_token);
  }
  return data.access_token as string;
}

async function freeeGet(path: string, token: string, extra: Record<string, string> = {}) {
  const url = new URL(API_BASE + path);
  url.searchParams.set('company_id', COMPANY_ID);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`freee ${path} → ${res.status}`);
  return res.json();
}

export async function GET() {
  try {
    const token = await getAccessToken();
    const [pl, bs, wallets] = await Promise.all([
      freeeGet('/api/1/reports/trial_pl', token, { fiscal_year: FISCAL_YEAR }),
      freeeGet('/api/1/reports/trial_bs', token, { fiscal_year: FISCAL_YEAR }),
      freeeGet('/api/1/walletables', token),
    ]);
    return NextResponse.json({ pl, bs, wallets }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
