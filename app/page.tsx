'use client';
import { useEffect, useRef, useState } from 'react';

/* ---------- 型 ---------- */
interface Balance {
  account_item_name?: string;
  account_category_name?: string;
  total_line?: boolean;
  closing_balance: number;
}
interface FinancialData {
  pl: { trial_pl: { balances: Balance[] } };
  bs: { trial_bs: { balances: Balance[] } };
}

/* ---------- ヘルパー ---------- */
function get(balances: Balance[], name: string, total = false): number {
  const row = balances.find(b =>
    total ? (b.total_line && b.account_category_name === name)
           : b.account_item_name === name
  );
  return row?.closing_balance ?? 0;
}
function fmt(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '▲' : '';
  if (abs >= 10000) return sign + Math.round(abs / 10000) + '万円';
  return sign + abs.toLocaleString() + '円';
}
function fmtFull(n: number): string {
  return (n < 0 ? '▲' : '') + Math.abs(n).toLocaleString() + '円';
}

/* ---------- スタイル ---------- */
const S: Record<string, React.CSSProperties> = {
  header: { background: '#1a1a2e', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontSize: 15, fontWeight: 700, margin: 0 },
  sub: { fontSize: 11, color: '#8892b0', marginTop: 2 },
  badge: { background: '#00d4aa', color: '#1a1a2e', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  main: { padding: '20px 24px', maxWidth: 960, margin: '0 auto', fontFamily: "-apple-system,'Hiragino Sans','Noto Sans JP',sans-serif", fontSize: 14 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 },
  kpiCard: { background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e8ecf0' },
  kpiLabel: { fontSize: 11, color: '#6b7280', marginBottom: 6 },
  kpiVal: { fontSize: 22, fontWeight: 700 },
  kpiSub: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  tag: { display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 10, marginTop: 6 },
  alertDanger: { background: '#ffeaea', border: '1px solid #ff4757', borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 },
  alertWarn: { background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 8, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 },
  insight: { background: 'linear-gradient(135deg,#667eea0a,#764ba20a)', border: '1px solid #e0e7ff', borderRadius: 10, padding: '14px 16px', marginBottom: 16 },
  insightH: { fontSize: 11, fontWeight: 700, color: '#6366f1', marginBottom: 6 },
  insightT: { fontSize: 12, color: '#374151', lineHeight: 1.8 },
  section: { background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #e8ecf0', marginBottom: 14 },
  sectionH: { fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12, borderBottom: '1px solid #f3f4f6', paddingBottom: 8 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 },
  updatedAt: { fontSize: 10, color: '#9ca3af', textAlign: 'right' as const, marginTop: 12 },
};

/* ---------- コンポーネント ---------- */
export default function Dashboard() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const plRef = useRef<HTMLCanvasElement>(null);
  const expRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartsRef = useRef<any[]>([]);

  const load = () => {
    setLoading(true); setError('');
    fetch('/api/financial')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!data || !plRef.current || !expRef.current) return;
    // destroy old charts
    chartsRef.current.forEach(c => c.destroy());
    chartsRef.current = [];

    const pl = data.pl.trial_pl.balances;
    const revenue     = get(pl, '売上高');
    const grossProfit = get(pl, '売上総損益金額', true);
    const opIncome    = get(pl, '営業損益金額', true);
    const netIncome   = get(pl, '当期純損益金額', true);

    const expItems = [
      { name: '役員報酬',   val: get(pl, '役員報酬') },
      { name: '給料手当',   val: get(pl, '給料手当') },
      { name: '支払報酬料', val: get(pl, '支払報酬料') },
      { name: '法定福利費', val: get(pl, '法定福利費') },
      { name: '地代家賃',   val: get(pl, '地代家賃') },
      { name: 'その他',     val: get(pl, '通信費') + get(pl, '消耗品費') + get(pl, '支払手数料') + get(pl, '旅費交通費') + get(pl, '交際費') + get(pl, '会議費') + get(pl, '減価償却費') },
    ];

    // Chart.js is loaded via <script> tag — poll until available
    const tryInit = () => {
      // @ts-expect-error Chart is global
      if (typeof Chart === 'undefined') { setTimeout(tryInit, 100); return; }
      // @ts-expect-error Chart is global
      const ChartCls = Chart;

      chartsRef.current.push(new ChartCls(plRef.current, {
        type: 'bar',
        data: {
          labels: ['売上高', '粗利', '営業損益', '当期損益'],
          datasets: [{
            data: [revenue, grossProfit, opIncome, netIncome],
            backgroundColor: ['#6366f1', '#00b894', opIncome >= 0 ? '#00b894' : '#ff4757', netIncome >= 0 ? '#00b894' : '#ff4757'],
            borderRadius: 6,
          }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (v: number) => Math.abs(v) >= 10000 ? (v/10000).toFixed(0)+'万' : String(v), font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } } },
      }));

      chartsRef.current.push(new ChartCls(expRef.current, {
        type: 'doughnut',
        data: {
          labels: expItems.map(e => e.name),
          datasets: [{ data: expItems.map(e => e.val), backgroundColor: ['#6366f1','#00b894','#f59e0b','#ef4444','#8b5cf6','#d1d5db'], borderWidth: 2, borderColor: '#fff' }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 12 } } } },
      }));
    };
    tryInit();
  }, [data]);

  if (loading) return (
    <>
      <div style={S.header}><div><div style={S.h1}>株式会社ゴールデンレコード</div><div style={S.sub}>MMOL Finance Agent｜AI財務参謀ダッシュボード</div></div><span style={S.badge}>LIVE</span></div>
      <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontFamily: S.main.fontFamily }}>⏳ freeeからデータを取得中...</div>
    </>
  );

  if (error) return (
    <>
      <div style={S.header}><div><div style={S.h1}>株式会社ゴールデンレコード</div><div style={S.sub}>MMOL Finance Agent｜AI財務参謀ダッシュボード</div></div><span style={S.badge}>LIVE</span></div>
      <div style={{ ...S.main, color: '#dc2626' }}>⚠️ エラー: {error}</div>
    </>
  );

  const pl = data!.pl.trial_pl.balances;
  const bs = data!.bs.trial_bs.balances;

  const revenue     = get(pl, '売上高');
  const cogs        = get(pl, '売上原価', true);
  const grossProfit = get(pl, '売上総損益金額', true);
  const sgaTotal    = get(pl, '販売管理費', true);
  const opIncome    = get(pl, '営業損益金額', true);
  const netIncome   = get(pl, '当期純損益金額', true);
  const grossMargin = revenue ? (grossProfit / revenue * 100).toFixed(1) : '0';

  const bankBalance = get(bs, 'りそな（法人）（API） 473 渋谷支店 普通 ***6288');
  const cash        = get(bs, '現金');
  const totalCash   = bankBalance + cash;
  const ar          = get(bs, '売掛金');
  const unpaid      = get(bs, '未払金');
  const card        = get(bs, 'freeeカード Unlimited');
  const totalLiab   = get(bs, '流動負債', true);

  const laborCost   = get(pl, '役員報酬') + get(pl, '給料手当') + get(pl, '賞与') + get(pl, '法定福利費');
  const laborRatio  = revenue ? (laborCost / revenue * 100).toFixed(1) : '0';

  const expenses = [
    { name: '役員報酬', val: get(pl, '役員報酬') }, { name: '給料手当', val: get(pl, '給料手当') },
    { name: '支払報酬料', val: get(pl, '支払報酬料') }, { name: '法定福利費', val: get(pl, '法定福利費') },
    { name: '地代家賃', val: get(pl, '地代家賃') }, { name: '通信費', val: get(pl, '通信費') },
    { name: '賞与', val: get(pl, '賞与') }, { name: '支払手数料', val: get(pl, '支払手数料') },
    { name: '消耗品費', val: get(pl, '消耗品費') }, { name: '減価償却費', val: get(pl, '減価償却費') },
    { name: '旅費交通費', val: get(pl, '旅費交通費') }, { name: '交際費', val: get(pl, '交際費') },
  ].sort((a, b) => b.val - a.val);
  const maxExp = expenses[0]?.val || 1;

  const now = new Date().toLocaleString('ja-JP');

  const tdStyle: React.CSSProperties = { padding: '7px 8px', borderBottom: '1px solid #f3f4f6', fontSize: 12 };
  const thStyle: React.CSSProperties = { fontSize: 11, color: '#6b7280', padding: '6px 8px', background: '#f9fafb', textAlign: 'left' };

  return (
    <>
      {/* ヘッダー */}
      <div style={S.header}>
        <div>
          <div style={S.h1}>株式会社ゴールデンレコード</div>
          <div style={S.sub}>MMOL Finance Agent｜AI財務参謀ダッシュボード</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={load} style={{ background: 'none', border: '1px solid #8892b0', color: '#8892b0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 11 }}>🔄 更新</button>
          <span style={S.badge}>LIVE</span>
        </div>
      </div>

      <div style={S.main}>
        {/* アラート */}
        {netIncome < 0 && <div style={S.alertDanger}><span>🔴</span><span>当期純損失 {fmtFull(Math.abs(netIncome))} の赤字です。費用が売上を上回っています。</span></div>}
        {totalCash < totalLiab * 0.5 && <div style={S.alertWarn}><span>⚠️</span><span>流動負債（{fmt(totalLiab)}）に対して手元資金（{fmt(totalCash)}）が少なくなっています。</span></div>}
        {parseFloat(laborRatio) > 60 && <div style={S.alertWarn}><span>⚠️</span><span>人件費率が{laborRatio}%と高水準です（役員報酬・給与・賞与・社保含む）。</span></div>}

        {/* KPIカード */}
        <div style={S.kpiGrid}>
          {[
            { label: '🏦 銀行残高（りそな）', val: fmt(bankBalance), sub: `現金含む手元資金 ${fmt(totalCash)}`, tag: totalCash > 3000000 ? { txt: '安全圏', ok: true } : { txt: '要注意', ok: false } },
            { label: '📋 売掛金残高', val: fmt(ar), sub: '入金待ち', tag: { txt: '要確認', ok: true } },
            { label: '💳 未払金・支払予定', val: fmt(unpaid), sub: `カード残 ${fmt(card)}`, tag: { txt: '支払確認', ok: false } },
            { label: '📊 当期純損益', val: fmt(netIncome), sub: 'FY2025累計', tag: netIncome >= 0 ? { txt: '黒字', ok: true } : { txt: '赤字', ok: false } },
          ].map((c, i) => (
            <div key={i} style={S.kpiCard}>
              <div style={S.kpiLabel}>{c.label}</div>
              <div style={{ ...S.kpiVal, color: c.label.includes('損益') ? (netIncome < 0 ? '#ff4757' : '#00b894') : '#1a1a2e' }}>{c.val}</div>
              <div style={S.kpiSub}>{c.sub}</div>
              <span style={{ ...S.tag, background: c.tag.ok ? '#d1fae5' : '#fee2e2', color: c.tag.ok ? '#065f46' : '#991b1b' }}>{c.tag.txt}</span>
            </div>
          ))}
        </div>

        {/* AIインサイト */}
        <div style={S.insight}>
          <div style={S.insightH}>🤖 AI財務参謀からの所見</div>
          <div style={S.insightT}>
            売上 {fmt(revenue)}・粗利率 {grossMargin}% は良好ですが、
            <strong>販管費 {fmt(sgaTotal)} が売上を上回っており、営業損失 {fmt(Math.abs(opIncome))} が発生しています</strong>。
            主因は人件費（役員報酬・給与・社保含む合計 {fmt(laborCost)}）で、売上比 {laborRatio}%。
            手元資金 {fmt(totalCash)} は現時点で確保できていますが、赤字が続く場合は数ヶ月以内に資金繰りの圧迫が生じる可能性があります。
            売上拡大か、固定費の見直しを早めに検討することを推奨します。
          </div>
        </div>

        {/* グラフ */}
        <div style={S.chartsRow}>
          <div style={S.section}>
            <div style={S.sectionH}>損益サマリー（FY2025）</div>
            <div style={{ position: 'relative', height: 200 }}><canvas ref={plRef} /></div>
          </div>
          <div style={S.section}>
            <div style={S.sectionH}>主要費用構成</div>
            <div style={{ position: 'relative', height: 200 }}><canvas ref={expRef} /></div>
          </div>
        </div>

        {/* PLテーブル */}
        <div style={S.section}>
          <div style={S.sectionH}>📑 損益計算書サマリー（FY2025 累計）</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>項目</th><th style={{ ...thStyle, textAlign: 'right' }}>金額</th><th style={{ ...thStyle, textAlign: 'right' }}>売上比</th></tr></thead>
            <tbody>
              {[
                { label: '売上高', val: revenue, ratio: '100%', bold: false },
                { label: '　外注費（売上原価）', val: -cogs, ratio: `${revenue ? (cogs/revenue*100).toFixed(1) : 0}%`, bold: false },
                { label: '売上総利益（粗利）', val: grossProfit, ratio: `${grossMargin}%`, bold: true },
                { label: '　販売管理費計', val: -sgaTotal, ratio: `${revenue ? (sgaTotal/revenue*100).toFixed(1) : 0}%`, bold: false },
                { label: '営業損益', val: opIncome, ratio: `${revenue ? (Math.abs(opIncome)/revenue*100).toFixed(1) : 0}%`, bold: true },
                { label: '当期純損益', val: netIncome, ratio: '－', bold: true },
              ].map((r, i) => (
                <tr key={i} style={{ background: r.bold ? '#f9fafb' : 'transparent' }}>
                  <td style={{ ...tdStyle, fontWeight: r.bold ? 700 : 400 }}>{r.label}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: r.bold ? 700 : 400, color: r.val < 0 ? '#ff4757' : r.val > 0 && r.bold ? '#00b894' : '#1a1a2e' }}>{fmtFull(r.val)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#6b7280' }}>{r.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BSテーブル */}
        <div style={S.section}>
          <div style={S.sectionH}>💰 貸借対照表サマリー（FY2025 末）</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>項目</th><th style={{ ...thStyle, textAlign: 'right' }}>金額</th></tr></thead>
            <tbody>
              {[
                { label: '現金・預金（りそな＋現金）', val: totalCash, bold: false },
                { label: '売掛金', val: ar, bold: false },
                { label: '流動資産', val: get(bs, '流動資産', true), bold: true },
                { label: '未払金', val: -unpaid, bold: false },
                { label: 'freeeカード Unlimited', val: -card, bold: false },
                { label: '流動負債', val: -totalLiab, bold: true },
                { label: '純資産', val: get(bs, '純資産', true), bold: true },
              ].map((r, i) => (
                <tr key={i} style={{ background: r.bold ? '#f9fafb' : 'transparent' }}>
                  <td style={{ ...tdStyle, fontWeight: r.bold ? 700 : 400 }}>{r.label}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: r.bold ? 700 : 400, color: r.val < 0 ? '#ff4757' : '#1a1a2e' }}>{fmtFull(r.val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 販管費明細 */}
        <div style={S.section}>
          <div style={S.sectionH}>📊 販管費明細</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
            {expenses.map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <span style={{ fontSize: 11, color: '#374151', width: 90, flexShrink: 0 }}>{e.name}</span>
                <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${(e.val / maxExp * 100).toFixed(0)}%`, height: '100%', background: '#6366f1', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 11, color: '#6b7280', width: 70, textAlign: 'right', flexShrink: 0 }}>{fmt(e.val)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.updatedAt}>最終取得: {now}｜データソース: freee会計（FY2025）｜株式会社ゴールデンレコード</div>
      </div>

      {/* Chart.js CDN */}
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js" async />
    </>
  );
}
