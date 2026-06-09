import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const KV_KEY = 'freee_refresh_token';

export async function POST(req: Request) {
  try {
    const { token, secret } = await req.json();
    const expectedSecret = process.env.FREEE_CLIENT_SECRET ?? '';
    if (!secret || secret !== expectedSecret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (!token) {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }
    await kv.set(KV_KEY, token);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
