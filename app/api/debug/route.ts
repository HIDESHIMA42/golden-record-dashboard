import { NextResponse } from 'next/server';

export async function GET() {
  const mask = (s: string) => s ? s.substring(0, 4) + '...' + s.slice(-4) + ` (length:${s.length})` : '(empty)';
  return NextResponse.json({
    FREEE_CLIENT_ID:     mask(process.env.FREEE_CLIENT_ID ?? ''),
    FREEE_CLIENT_SECRET: mask(process.env.FREEE_CLIENT_SECRET ?? ''),
    FREEE_REFRESH_TOKEN: mask(process.env.FREEE_REFRESH_TOKEN ?? ''),
    FREEE_COMPANY_ID:    process.env.FREEE_COMPANY_ID ?? '(empty)',
  });
}
