import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';

/* ─── Brand tokens ───────────────────────────────────────────────────────────── */
const T = {
  bg:        '#F5F0E6',
  bgCard:    '#FFFFFF',
  bgTint:    '#EDE8DC',
  border:    '#CEC8B8',
  borderDk:  '#B0A898',
  ink:       '#1C1410',
  inkMid:    '#6B6258',
  inkMuted:  '#9C9590',
  slate:     '#2B4870',
  slateDk:   '#1A2535',
  slateMid:  '#3D5F8F',
  slateLt:   '#4E709C',
  slatePale: '#E8EDF5',
  terra:     '#B85C38',
  terraM:    '#C97A5E',
  terraPale: '#F5E8E2',
  red:       '#C0392B',
  green:     '#2E7D4F',
  amber:     '#B8860B',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: ${T.slateDk}; }
  ::selection { background: ${T.terraPale}; }
  ::-webkit-scrollbar { width: 6px; background: ${T.slateDk}; }
  ::-webkit-scrollbar-thumb { background: #2B4870; border-radius: 3px; }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes count-flash {
    0%   { color: #ff6b6b; }
    100% { color: #ff3333; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .live-counter {
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
`;

/* ─── War start ───────────────────────────────────────────────────────────────── */
const WAR_START = new Date('2026-02-28T00:00:00Z');
function getDayCount() {
  return Math.max(0, Math.floor((new Date() - WAR_START) / (1000 * 60 * 60 * 24)));
}

/* ─── Data constants ─────────────────────────────────────────────────────────── */
const INAUG_WTI   = 76.0;
const INAUG_BRENT = 79.0;
const PEAK_WTI    = 119.48;

const HORMUZ = {
  dropPct: 95, kplerDropPct: 92,
  src: 'S&P Global (95%, wk Mar 1); Kpler (92%, wk Mar 12)',
  shipsStruck: 13, shipsSrc: 'USNI News, Mar 10',
};

const WAR_COST_DAY6_B  = 11.3;
const WAR_COST_DAY6    = 6;
const WAR_COST_DAILY_B = 0.22;
const WAR_COST_PER_SEC = (WAR_COST_DAILY_B * 1e9) / 86400; /* ~$2,546/sec sustained */
const PWBM_MIDPOINT_B  = 65;
const PWBM_TOTAL_B     = 180;
const US_HOUSEHOLDS    = 132;

function getWarCostEstimate(dayCount) {
  const sustained = Math.max(0, dayCount - WAR_COST_DAY6);
  return WAR_COST_DAY6_B * 1e9 + sustained * WAR_COST_DAILY_B * 1e9;
}

const TRUMP_SAID = [
  { date: 'Jan 20, 2025', said: '"We\'re going to get the price of energy down — drill, baby, drill."', reality: 'WTI that day: $76. Today: live above. A very small price to pay.' },
  { date: 'Mar 1, 2026',  said: '"Whatever it takes, we projected four to five weeks."', reality: 'Day 2. He has since said it will be over "very soon" approximately nine times.' },
  { date: 'Mar 9, 2026',  said: '"It will be over soon."', reality: 'WTI hit $119.48 that day. Iran named a new Supreme Leader. Markets disagreed.' },
  { date: 'Mar 10, 2026', said: '"I\'m thinking about taking over the Strait of Hormuz."', reality: 'Iran mined it instead. 95% drop in transits. The thinking continues.' },
  { date: 'Mar 11, 2026', said: '"We won."', reality: 'Day 12. Three more vessels struck in the Strait that same day.' },
  { date: 'Mar 13, 2026', said: '"Iran will take years to rebuild."', reality: 'Khamenei simultaneously vowed to keep the blockade. Oil: still above $100.' },
];

const BILL = [
  { label: 'US KIA',          value: '13',      note: '6 Kuwait · 1 non-combat · 6 KC-135 Iraq', src: 'CENTCOM / CNN, Mar 13' },
  { label: 'US WIA',          value: '~140',    note: '108 RTD · 8 remain severe', src: 'Pentagon, Mar 10' },
  { label: 'Iranian dead',    value: '1,348+',  note: 'UN rep confirmed · HRANA est. 7,000 · WH claims 32,000', src: 'Al Jazeera / UN, Mar 13' },
  { label: 'Iranian injured', value: '17,000+', note: "UN rep Iravani, confirmed", src: 'Al Jazeera, Mar 13' },
  { label: 'Lebanon dead',    value: '687',     note: 'Incl. 98 children, since Mar 2', src: 'Lebanon Info Minister, Mar 13' },
  { label: 'Minab school',    value: '148–180', note: 'Girls school near Bandar Abbas · disputed', src: 'Iranian govt (disputed)' },
  { label: 'Ships struck',    value: '13+',     note: 'Commercial vessels in Strait since Feb 28', src: 'USNI News, Mar 10' },
  { label: 'Gulf civilians',  value: 'Dozens',  note: 'UAE, Kuwait, Saudi, Bahrain — Iranian strikes', src: 'Reuters' },
];

const EVENTS_2025 = [
  { date: 'Jan 20', tier: 'baseline', label: 'Inauguration. "Drill, baby, drill." WTI: ~$76. The largest US air power armada in the Middle East since 2003 begins assembling.' },
  { date: 'Jun 13', tier: 'critical', label: 'Israel strikes Iran\'s nuclear facilities. Brent spikes 8.8%. Iran retaliates.' },
  { date: 'Jun 22', tier: 'critical', label: 'US B-2s and Tomahawks strike Fordow, Natanz, Isfahan — "Operation Midnight Hammer." First direct US attack on Iran since 1988.' },
  { date: 'Jun 23', tier: 'neutral',  label: 'Ceasefire. Oil closes down. Iran parliament votes to close the Strait — National Security Council declines. For now.' },
  { date: 'Oct',    tier: 'neutral',  label: 'Ceasefire holds. WTI settles back to the $60s. OPEC+ floods the market.' },
  { date: 'Nov–Dec', tier: 'neutral', label: 'WTI crashes to ~$55 — lowest in four years. Shale patch surrenders. Rigs stop.' },
  { date: 'Dec 28', tier: 'critical', label: 'Protests erupt across Iran. BNEF notes rising call skew in WTI options. Oil above $66.' },
];

const EVENTS_2026 = [
  { date: 'Jan 12', tier: 'critical', label: '25% tariff on any country doing business with Iran. Brent options skew spikes 19 pts.' },
  { date: 'Feb 10', tier: 'neutral',  label: 'US–Iran nuclear talks in Oman. Markets briefly believe it. WTI dips to $63.' },
  { date: 'Feb 27', tier: 'neutral',  label: 'EIA: US crude inventories +3.5M bbl. WTI at ~$67. The buildup continues.' },
  { date: 'Feb 28', tier: 'critical', label: 'Operation Epic Fury. ~900 strikes in 12 hours. Khamenei killed. Hormuz declared closed.' },
  { date: 'Mar 1',  tier: 'critical', label: 'First 3 US KIA. Massive Iranian retaliatory barrage. OPEC+ raises quota 220k bpd. It does not move prices.' },
  { date: 'Mar 2',  tier: 'critical', label: 'US embassy Kuwait struck. Girls school in Minab: 148–180 dead. QatarEnergy halts Ras Laffan LNG. 6 more US KIA.' },
  { date: 'Mar 3',  tier: 'critical', label: 'Goldman: $14/bbl war premium embedded. Iraq oilfields -70%. Kuwait and UAE cut production.' },
  { date: 'Mar 9',  tier: 'peak',     label: 'Israel bombs 30 Iranian oil depots. WTI peaks at $119.48. Mojtaba Khamenei named Supreme Leader. Trump: "It will be over soon."' },
  { date: 'Mar 10', tier: 'critical', label: 'Trump floats "taking over" the Strait. Russia sanctions waiver. Saudi shuts Safaniya and Zuluf offshore fields.' },
  { date: 'Mar 11', tier: 'critical', label: 'IEA releases 400M barrels — largest emergency reserve release ever. Three more vessels struck. Oil holds above $100.' },
  { date: 'Mar 12', tier: 'critical', label: 'Khamenei first statement: vows Hormuz stays closed, threatens US bases. WTI +10% on statement alone. UK confirms Iran mining the Strait. 3.2M Iranians displaced.' },
  { date: 'Mar 13', tier: 'critical', label: 'KC-135 tanker crashes western Iraq, all 6 crew lost. Oil above $100 despite every relief measure deployed. Trump vows to hit Iran "very hard."' },
  { date: 'Mar 13', tier: 'today',    label: 'Today. Day 13. The war is apparently not over.' },
];

const tierColor = { baseline: T.green, neutral: T.amber, critical: T.terra, peak: T.red, today: T.red };

/* ─── Live war cost counter ──────────────────────────────────────────────────── */
function useLiveCost(dayCount) {
  const base = getWarCostEstimate(dayCount);
  const [cost, setCost] = useState(base);
  useEffect(() => {
    const t = setInterval(() => setCost(c => c + WAR_COST_PER_SEC), 1000);
    return () => clearInterval(t);
  }, [dayCount]);
  return cost;
}

function fmtCost(n) {
  const b = n / 1e9;
  if (b >= 1000) return `$${(b/1000).toFixed(2)}T`;
  return `$${b.toFixed(2)}B`;
}

/* ─── Oil price journey visual ───────────────────────────────────────────────── */
function OilJourney({ price }) {
  const MIN = 55, MAX = 125;
  const pct  = v => Math.min(100, Math.max(0, ((v - MIN) / (MAX - MIN)) * 100));
  const inaugPct = pct(INAUG_WTI);
  const peakPct  = pct(PEAK_WTI);
  const nowPct   = pct(price || 95);
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  return (
    <div style={{ padding: '2rem 2rem 1.5rem' }}>
      <p style={{ ...serif, margin: '0 0 1.5rem', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.terra }}>
        WTI Price Journey — Inauguration to Now
      </p>
      {/* Price track */}
      <div style={{ position: 'relative', height: '48px', marginBottom: '0.5rem' }}>
        {/* Base track */}
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', transform: 'translateY(-50%)' }}/>
        {/* Fill to now */}
        <div style={{ position: 'absolute', top: '50%', left: 0, width: `${nowPct}%`, height: '4px', background: `linear-gradient(90deg, ${T.green}, ${T.amber} 40%, ${T.terra} 70%, ${T.red})`, borderRadius: '2px', transform: 'translateY(-50%)', transition: 'width 1s ease' }}/>
        {/* Inauguration marker */}
        <div style={{ position: 'absolute', left: `${inaugPct}%`, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '3px', height: '24px', background: T.green, borderRadius: '2px' }}/>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: T.green, border: '2px solid rgba(0,0,0,0.5)' }}/>
        </div>
        {/* Peak marker */}
        <div style={{ position: 'absolute', left: `${peakPct}%`, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ ...display, fontSize: '9px', color: T.red, whiteSpace: 'nowrap', marginBottom: '2px' }}>PEAK</div>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: T.red, border: '2px solid rgba(0,0,0,0.5)' }}/>
        </div>
        {/* Now marker */}
        <div style={{ position: 'absolute', left: `${nowPct}%`, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: T.terra, border: '3px solid rgba(255,255,255,0.9)', boxShadow: `0 0 0 4px ${T.terra}44` }}/>
        </div>
      </div>
      {/* Labels */}
      <div style={{ position: 'relative', height: '40px' }}>
        <div style={{ position: 'absolute', left: `${inaugPct}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
          <p style={{ ...display, margin: 0, fontSize: '1.1rem', color: T.green, lineHeight: 1 }}>$76</p>
          <p style={{ ...serif, margin: '2px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>1/20/25</p>
        </div>
        <div style={{ position: 'absolute', left: `${peakPct}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
          <p style={{ ...display, margin: 0, fontSize: '1.1rem', color: T.red, lineHeight: 1 }}>$119.48</p>
          <p style={{ ...serif, margin: '2px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>Mar 9</p>
        </div>
        <div style={{ position: 'absolute', left: `${nowPct}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
          <p style={{ ...display, margin: 0, fontSize: '1.1rem', color: T.terra, lineHeight: 1 }}>${(price || 95).toFixed(2)}</p>
          <p style={{ ...serif, margin: '2px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>NOW</p>
        </div>
      </div>
      <p style={{ ...serif, fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: '8px 0 0', fontStyle: 'italic' }}>
        Scale: ${MIN}–${MAX}/bbl. WTI crude (CL=F) via Yahoo Finance.
      </p>
    </div>
  );
}

/* ─── Hormuz visual bar ──────────────────────────────────────────────────────── */
function HormuzBar() {
  const serif   = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  const openPct = 5; /* 95% closed = 5% open */
  return (
    <div style={{ padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
        <p style={{ ...serif, margin: 0, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.terra }}>
          Strait of Hormuz — Transit Status
        </p>
        <p style={{ ...serif, margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{HORMUZ.src}</p>
      </div>
      {/* Bar */}
      <div style={{ position: 'relative', height: '36px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '8px' }}>
        {/* Closed portion */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${HORMUZ.dropPct}%`, background: `linear-gradient(90deg, ${T.red}cc, ${T.red}88)`, display: 'flex', alignItems: 'center', paddingLeft: '12px' }}>
          <span style={{ ...display, fontSize: '1.1rem', color: 'rgba(255,255,255,0.95)', fontStyle: 'italic' }}>{HORMUZ.dropPct}% CLOSED</span>
        </div>
        {/* Open portion */}
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${openPct}%`, background: `${T.green}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...serif, fontSize: '10px', color: T.green }}>{openPct}%</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <p style={{ ...serif, margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
          <span style={{ color: T.red, fontWeight: 600 }}>{HORMUZ.shipsStruck}</span> commercial vessels struck since Feb 28
        </p>
        <p style={{ ...serif, margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{HORMUZ.shipsSrc}</p>
      </div>
    </div>
  );
}

/* ─── OilChart (preserved) ───────────────────────────────────────────────────── */
function OilChart({ chartReady }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  useEffect(() => {
    if (!chartReady || !canvasRef.current) return;
    let cancelled = false;
    fetch('/api/history').then(r => r.json()).then(data => {
      if (cancelled || !data.points || !canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const labels = data.points.map(p => { const d = new Date(p.date + 'T12:00:00Z'); return `${d.getUTCMonth()+1}/${d.getUTCDate()}`; });
      const values = data.points.map(p => p.close);
      chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'WTI $/bbl', data: values, borderColor: T.terra, backgroundColor: `${T.terra}18`, borderWidth: 2, pointRadius: 2, tension: 0.35, fill: true },
            { label: 'Inaug. baseline', data: labels.map(() => 76), borderColor: T.green, borderWidth: 1.5, borderDash: [4,4], pointRadius: 0, fill: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.dataset.label.includes('baseline') ? ' $76 baseline' : ` $${c.parsed.y.toFixed(2)}/bbl` } } },
          scales: {
            y: { min: 55, max: 130, ticks: { callback: v => '$'+v, color: 'rgba(245,241,235,0.4)', font: { size: 10, family: "'Source Serif 4', Georgia, serif" } }, grid: { color: 'rgba(255,255,255,0.05)' }, border: { color: 'transparent' } },
            x: { ticks: { color: 'rgba(245,241,235,0.4)', font: { size: 10, family: "'Source Serif 4', Georgia, serif" }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false }, border: { color: 'transparent' } },
          },
        },
      });
    });
    return () => { cancelled = true; };
  }, [chartReady]);
  return <div style={{ position: 'relative', width: '100%', height: '180px' }}><canvas ref={canvasRef}/></div>;
}

/* ─── Gauge ──────────────────────────────────────────────────────────────────── */
function Gauge({ pct }) {
  const p = Math.min(100, Math.max(0, pct));
  const zones = [
    { threshold: 0,   label: 'Not fucked up',                    color: T.green   },
    { threshold: 25,  label: 'More than a little',               color: T.amber   },
    { threshold: 50,  label: 'Significantly fucked up',          color: T.terra   },
    { threshold: 75,  label: 'Very fucked up',                   color: T.red     },
    { threshold: 100, label: 'Completely unbelievably fucked up', color: '#7B0000' },
  ];
  const activeIdx = zones.reduce((best, z, i) => (p >= z.threshold ? i : best), 0);
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  return (
    <div style={{ padding: '0 0 0.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <span style={{ ...display, fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontStyle: 'italic', color: zones[activeIdx].color }}>
          {zones[activeIdx].label}
        </span>
      </div>
      <div style={{ position: 'relative', height: '20px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${T.green}22 0%, ${T.amber}22 25%, ${T.terra}33 50%, ${T.red}33 75%, #7B000044 100%)` }}/>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p}%`, background: `linear-gradient(90deg, ${T.green}, ${zones[activeIdx].color})`, opacity: 0.9, transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)' }}/>
        {[25, 50, 75].map(x => <div key={x} style={{ position: 'absolute', left: `${x}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.4)' }}/>)}
      </div>
      <div style={{ textAlign: 'center' }}>
        <span style={{ ...serif, fontSize: '12px', color: 'rgba(245,241,235,0.5)' }}>
          Reading: <strong style={{ color: zones[activeIdx].color }}>{p.toFixed(1)}%</strong> of maximum recorded fuckup
        </span>
      </div>
    </div>
  );
}

/* ─── Trump Said vs Reality ──────────────────────────────────────────────────── */
function TrumpSaid() {
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  return (
    <div>
      {TRUMP_SAID.map((item, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '0', marginBottom: '1px' }}>
          {/* Date */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem 0.75rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.3)', lineHeight: 1.4 }}>{item.date}</span>
          </div>
          {/* He said */}
          <div style={{ background: 'rgba(43, 72, 112, 0.25)', padding: '1rem 1.25rem', borderLeft: '3px solid rgba(78,112,156,0.4)' }}>
            <p style={{ ...serif, margin: '0 0 3px', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: T.slateLt }}>He said</p>
            <p style={{ ...serif, margin: 0, fontSize: '12px', color: 'rgba(245,241,235,0.8)', lineHeight: 1.6, fontStyle: 'italic' }}>{item.said}</p>
          </div>
          {/* Reality */}
          <div style={{ background: 'rgba(192, 57, 43, 0.12)', padding: '1rem 1.25rem', borderLeft: '3px solid rgba(192,57,43,0.5)' }}>
            <p style={{ ...serif, margin: '0 0 3px', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: T.red }}>Reality</p>
            <p style={{ ...serif, margin: 0, fontSize: '12px', color: 'rgba(245,241,235,0.65)', lineHeight: 1.6 }}>{item.reality}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Butcher's Bill ─────────────────────────────────────────────────────────── */
function ButcherBill() {
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.04)' }}>
      {BILL.map((item, i) => (
        <div key={i} style={{ background: '#0D1923', padding: '1.25rem 1.5rem' }}>
          <p style={{ ...serif, margin: '0 0 6px', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)' }}>{item.label}</p>
          <p style={{ ...display, margin: '0 0 4px', fontSize: '2rem', color: item.label.includes('US KIA') || item.label.includes('Minab') ? T.red : 'rgba(245,241,235,0.9)', lineHeight: 1, fontStyle: 'italic' }}>{item.value}</p>
          <p style={{ ...serif, margin: '0 0 2px', fontSize: '10px', color: 'rgba(245,241,235,0.4)', lineHeight: 1.5 }}>{item.note}</p>
          <p style={{ ...serif, margin: 0, fontSize: '9px', color: 'rgba(245,241,235,0.2)', fontStyle: 'italic' }}>{item.src}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Commodity card ─────────────────────────────────────────────────────────── */
function CommodityCard({ c }) {
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  const isUp = c.changePct >= 0;
  const since = c.sinceInaugPct >= 0;
  return (
    <div style={{ background: '#0D1923', padding: '1.25rem', borderTop: `3px solid ${since ? T.red : T.green}` }}>
      <p style={{ ...serif, margin: '0 0 2px', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)' }}>{c.label}</p>
      {c.note && <p style={{ ...serif, margin: '0 0 4px', fontSize: '9px', color: 'rgba(245,241,235,0.25)', fontStyle: 'italic' }}>{c.note}</p>}
      <p style={{ ...display, margin: '0 0 3px', fontSize: '1.6rem', color: 'rgba(245,241,235,0.95)', lineHeight: 1 }}>
        {c.unit === '$/gal' ? `$${c.price}` : c.unit.startsWith('cents') ? `${c.price}¢` : `$${c.price}`}
      </p>
      <p style={{ ...serif, margin: '0 0 4px', fontSize: '11px', color: isUp ? T.terra : T.green }}>
        {isUp ? '▲' : '▼'} {Math.abs(c.changePct)}% today
      </p>
      <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ ...serif, fontSize: '11px', fontWeight: 600, color: since ? T.terra : T.green }}>
          {since ? '+' : ''}{c.sinceInaugPct}% since 1/20/25
        </span>
      </div>
    </div>
  );
}

/* ─── Gas Calculator ─────────────────────────────────────────────────────────── */
function GasCalc({ rbobPrice }) {
  const [mpg, setMpg]     = useState(28);
  const [miles, setMiles] = useState(1000);
  const RETAIL_MARKUP = 1.00;
  const INAUG_RETAIL  = 3.13;
  const currentRetail = rbobPrice ? parseFloat((rbobPrice + RETAIL_MARKUP).toFixed(2)) : 3.72;
  const extraPerGal   = currentRetail - INAUG_RETAIL;
  const galPerMonth   = miles / mpg;
  const extraPerMonth = (extraPerGal * galPerMonth).toFixed(2);
  const extraPerYear  = (extraPerGal * galPerMonth * 12).toFixed(0);
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1px' }}>
        {[
          { label: 'Your MPG', val: mpg, set: setMpg, min: 10, max: 80 },
          { label: 'Miles / month', val: miles, set: setMiles, min: 100, max: 5000 },
        ].map(({ label, val, set, min, max }) => (
          <div key={label} style={{ background: '#0D1923', padding: '1rem 1.25rem' }}>
            <label style={{ ...serif, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)', display: 'block', marginBottom: '6px' }}>{label}</label>
            <input type="number" value={val} min={min} max={max}
              onChange={e => set(Math.max(1, parseFloat(e.target.value) || 1))}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', ...serif, fontSize: '1.2rem', color: 'rgba(245,241,235,0.9)', outline: 'none' }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
        {[
          { label: 'Pump price now', val: `$${currentRetail.toFixed(2)}`, sub: 'vs. $3.13 on 1/20/25', color: T.red },
          { label: 'Extra / month', val: `$${extraPerMonth}`, sub: 'at your mileage', color: parseFloat(extraPerMonth) > 0 ? T.terra : T.green },
          { label: 'Annualized', val: `$${parseInt(extraPerYear).toLocaleString()}`, sub: 'per year', color: parseFloat(extraPerYear) > 0 ? T.red : T.green },
        ].map((m, i) => (
          <div key={i} style={{ background: '#0D1923', padding: '1.25rem' }}>
            <p style={{ ...serif, margin: '0 0 4px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)' }}>{m.label}</p>
            <p style={{ ...display, margin: '0 0 3px', fontSize: '1.8rem', color: m.color, lineHeight: 1 }}>{m.val}</p>
            <p style={{ ...serif, margin: 0, fontSize: '10px', color: 'rgba(245,241,235,0.35)' }}>{m.sub}</p>
          </div>
        ))}
      </div>
      <p style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.25)', margin: '8px 0 0', fontStyle: 'italic', lineHeight: 1.7 }}>
        Pump price = RBOB futures + $1.00 (taxes + retail). Inaug. baseline: $3.13/gal (EIA, Jan 20 2025). EIA projects gas may approach $5.00/gal in Q2 if Hormuz closure persists.
      </p>
    </div>
  );
}

/* ─── Average American cost ──────────────────────────────────────────────────── */
function AverageAmericanCost({ liveCost }) {
  const warCostB  = liveCost / 1e9;
  const perHH     = ((warCostB * 1000) / US_HOUSEHOLDS).toFixed(0);
  const pwbmPerHH = ((PWBM_MIDPOINT_B * 1000) / US_HOUSEHOLDS).toFixed(0);
  const totPerHH  = ((PWBM_TOTAL_B * 1000) / US_HOUSEHOLDS).toFixed(0);
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  const items = [
    { label: 'War cost to date', value: fmtCost(liveCost), note: 'Pentagon: $11.3B first 6 days + ~$220M/day sustained (CSIS). Live estimate.', src: 'The Hill / Pentagon, Mar 5; CSIS, Mar 5', color: T.red, live: true },
    { label: 'Your household share — so far', value: `$${parseInt(perHH).toLocaleString()}`, note: `132M US households. At ${fmtCost(liveCost)} total, each household's estimated unbudgeted share.`, src: 'US Census 2024; TLM calculation', color: T.red, live: false },
    { label: 'Projected direct cost', value: `$${PWBM_MIDPOINT_B}B`, note: 'Penn Wharton midpoint for a 2-month campaign. Range: $40B–$95B.', src: 'Penn Wharton Budget Model / Fortune, Mar 3', color: T.terra, live: false },
    { label: 'Your household share — projected', value: `$${parseInt(pwbmPerHH).toLocaleString()}`, note: `At $${PWBM_MIDPOINT_B}B midpoint. Full $180B economic impact = $${parseInt(totPerHH).toLocaleString()}/household.`, src: 'Penn Wharton / TLM calculation', color: T.terra, live: false },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#0D1923', padding: '1.5rem', borderTop: `3px solid ${item.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <p style={{ ...serif, margin: 0, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)' }}>{item.label}</p>
            {item.live && <span style={{ fontSize: '9px', color: T.red, letterSpacing: '0.1em', fontFamily: "'Source Serif 4', Georgia, serif" }}>● LIVE</span>}
          </div>
          <p className="live-counter" style={{ ...display, margin: '0 0 6px', fontSize: '2rem', color: item.color, lineHeight: 1 }}>{item.value}</p>
          <p style={{ ...serif, margin: '0 0 3px', fontSize: '11px', color: 'rgba(245,241,235,0.4)', lineHeight: 1.6 }}>{item.note}</p>
          <p style={{ ...serif, margin: 0, fontSize: '9px', color: 'rgba(245,241,235,0.2)', fontStyle: 'italic' }}>{item.src}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── What it could buy ──────────────────────────────────────────────────────── */
function WhatItCouldBuy({ liveCost }) {
  const warCostM = liveCost / 1e6;
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  const ITEMS = [
    { icon: '🏥', cat: 'Healthcare', val: `${Math.round(liveCost / 6000).toLocaleString()}`, unit: 'people with health insurance', note: 'ACA marketplace premium w/ subsidy ~$6,000/yr/person', src: 'KFF 2025', color: '#2E7D4F' },
    { icon: '🏫', cat: 'Public Education', val: `${Math.round(warCostM / 0.069).toLocaleString()}`, unit: 'teacher-years funded', note: 'Avg US public school teacher salary ~$69,000/yr (NEA 2024)', src: 'NEA 2024', color: T.slateLt },
    { icon: '🌉', cat: 'Infrastructure', val: `${(liveCost / 2.6e12 * 100).toFixed(1)}%`, unit: 'of the ASCE infrastructure gap', note: 'ASCE estimates $2.6T investment gap over 10 years', src: 'ASCE 2025', color: T.terra },
    { icon: '💰', cat: 'Tax Relief', val: `$${Math.round(warCostM / 100).toLocaleString()}`, unit: 'per working American', note: '~100M working Americans file taxes. Equal distribution.', src: 'IRS SOI 2024', color: T.amber },
    { icon: '🍽️', cat: 'Food Security', val: `${Math.round(liveCost / 2400).toLocaleString()}`, unit: 'families fed for a year', note: "SNAP avg benefit ~$2,400/yr per family of four", src: 'USDA FNS 2025', color: T.red },
    { icon: '🎓', cat: 'Student Aid', val: `${Math.round(liveCost / 7395).toLocaleString()}`, unit: 'max Pell Grants', note: 'Maximum Pell Grant: $7,395 for 2025–26 award year', src: 'Federal Student Aid 2025–26', color: '#1A2535' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
      {ITEMS.map((item, i) => (
        <div key={i} style={{ background: '#0D1923', padding: '1.5rem', borderTop: `3px solid ${item.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{item.icon}</span>
            <p style={{ ...serif, margin: 0, fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)' }}>{item.cat}</p>
          </div>
          <p className="live-counter" style={{ ...display, margin: '0 0 2px', fontSize: '1.5rem', color: item.color, lineHeight: 1 }}>{item.val}</p>
          <p style={{ ...serif, margin: '0 0 8px', fontSize: '10px', color: 'rgba(245,241,235,0.55)', fontWeight: 600 }}>{item.unit}</p>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '10px', color: 'rgba(245,241,235,0.35)', lineHeight: 1.5 }}>{item.note}</p>
          <p style={{ ...serif, margin: 0, fontSize: '9px', color: 'rgba(245,241,235,0.2)', fontStyle: 'italic' }}>{item.src}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Broader consumer impact ────────────────────────────────────────────────── */
function BroaderImpact() {
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  const IMPACTS = [
    { label: 'Groceries', est: '+$15–30/mo', note: 'Oil +25% from inaug → food CPI +~0.75%. Applied to avg household spend ~$550/mo. Fertilizer adds further lag-pressure.', src: 'Fed Board FEDS Notes, Dec 2023', color: T.red },
    { label: 'Airfares',  est: '+15–20%',    note: 'Jet fuel: ~25–30% of airline operating cost. JPMorgan projects airfare CPI 2.2% → ~20% if sustained through Q2.', src: 'JPMorgan via CNBC, Mar 11, 2026', color: T.red },
    { label: 'Consumables', est: '+$5–12/mo', note: 'Petroleum is a primary input for plastics, packaging, cleaning products, synthetics. Core CPI +~0.25% at current oil levels.', src: 'Fed Board FEDS Notes, Dec 2023', color: T.terra },
    { label: 'Durables', est: '1–2% costlier', note: 'PPI (producer prices) shows greater sensitivity to oil. Pass-through to retail durables runs 3–6 months. Effect building.', src: 'ScienceDirect, 2025', color: T.amber },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
      {IMPACTS.map((item, i) => (
        <div key={i} style={{ background: '#0D1923', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <p style={{ ...serif, margin: 0, fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)' }}>{item.label}</p>
            <span style={{ ...display, fontSize: '1.2rem', color: item.color }}>{item.est}</span>
          </div>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '11px', color: 'rgba(245,241,235,0.45)', lineHeight: 1.6 }}>{item.note}</p>
          <p style={{ ...serif, margin: 0, fontSize: '9px', color: 'rgba(245,241,235,0.2)', fontStyle: 'italic' }}>{item.src}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Incident timeline ──────────────────────────────────────────────────────── */
function Timeline({ events, year }) {
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      {/* Vertical line */}
      <div style={{ position: 'absolute', left: '7px', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.06)' }}/>
      {events.map((e, i) => (
        <div key={i} style={{ position: 'relative', paddingBottom: i < events.length - 1 ? '16px' : 0, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          {/* Dot */}
          <div style={{ position: 'absolute', left: '-24px', top: '5px', width: '10px', height: '10px', borderRadius: '50%', background: tierColor[e.tier], border: '2px solid #0D1923', flexShrink: 0 }}/>
          <span style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.3)', minWidth: '48px', paddingTop: '1px', letterSpacing: '0.04em', flexShrink: 0 }}>{e.date}</span>
          <span style={{ ...serif, fontSize: '12px', color: e.tier === 'today' ? T.terra : 'rgba(245,241,235,0.55)', lineHeight: 1.6, fontStyle: e.tier === 'today' ? 'italic' : 'normal' }}>{e.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Share card ─────────────────────────────────────────────────────────────── */
function ShareCard({ price, sinceInaugPct, fuckupFactor, dayCount, onClose }) {
  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.slateDk, border: '1px solid rgba(255,255,255,0.1)', borderTop: `4px solid ${T.terra}`, borderRadius: '4px', padding: '2rem', maxWidth: '480px', width: '100%' }}>
        <div style={{ ...serif, fontSize: '10px', letterSpacing: '0.2em', color: T.terraM, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Trump Fuckupometer™ — The Long Memo</div>
        <div style={{ ...display, fontSize: '1.3rem', fontStyle: 'italic', color: '#F5F1EB', marginBottom: '1.5rem' }}>Day {dayCount} of Operation Epic Fury</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
          {[
            { label: 'WTI Crude', value: `$${price}`, color: '#F5F1EB' },
            { label: 'Since 1/20/25', value: `+${sinceInaugPct}%`, color: T.terraM },
            { label: 'Fuckup Level', value: `${fuckupFactor}%`, color: T.red },
          ].map((m, i) => (
            <div key={i} style={{ background: T.slateDk, padding: '0.9rem 1rem' }}>
              <p style={{ ...serif, margin: '0 0 4px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.4)' }}>{m.label}</p>
              <p style={{ ...display, margin: 0, fontSize: '1.4rem', color: m.color, lineHeight: 1 }}>{m.value}</p>
            </div>
          ))}
        </div>
        <div style={{ ...serif, fontSize: '11px', color: 'rgba(245,241,235,0.4)', marginBottom: '1.25rem', fontStyle: 'italic' }}>
          &quot;We&apos;re going to get the price of energy down — drill, baby, drill.&quot; — Trump, Jan 20, 2025
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href={`https://twitter.com/intent/tweet?text=Day%20${dayCount}%20of%20Operation%20Epic%20Fury.%20WTI%3A%20%24${price}%2Fbbl%20(%2B${sinceInaugPct}%25%20since%20inauguration).%20%22Drill%20baby%20drill.%22%20%F0%9F%9B%A2%EF%B8%8F&url=https%3A%2F%2Ffuckupometer.thelongmemo.com`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '8px 18px', background: 'transparent', color: T.terraM, border: `1px solid ${T.terra}`, borderRadius: '2px', fontSize: '11px', textDecoration: 'none', ...serif, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Share on X →
          </a>
          <button onClick={onClose} style={{ padding: '8px 18px', background: 'transparent', color: 'rgba(245,241,235,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2px', fontSize: '11px', cursor: 'pointer', ...serif, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [data,        setData]        = useState(null);
  const [commodities, setCommodities] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);
  const [chartReady,  setChartReady]  = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [dayCount,    setDayCount]    = useState(getDayCount());

  useEffect(() => { const t = setInterval(() => setDayCount(getDayCount()), 60000); return () => clearInterval(t); }, []);

  const liveCost = useLiveCost(dayCount);

  const fetchAll = useCallback(async () => {
    try {
      const [oilRes, comRes] = await Promise.all([fetch('/api/oil'), fetch('/api/commodities')]);
      const [oil, com] = await Promise.all([oilRes.json(), comRes.json()]);
      setData(oil); setCommodities(com.commodities);
      setLastUpdated(new Date()); setError(null);
    } catch { setError('Live data unavailable — markets may be closed.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 5 * 60 * 1000); return () => clearInterval(t); }, [fetchAll]);

  const price        = data ? parseFloat(data.price) : 95.73;
  const fuckupFactor = data ? parseFloat(data.fuckupFactor) : 47;
  const isUp         = data ? parseFloat(data.change) >= 0 : true;
  const rbobPrice    = commodities ? parseFloat(commodities.find(c => c.ticker === 'RB=F')?.price || 2.72) : 2.72;

  const serif  = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };

  const sectionLabel = (text, color = T.terra) => (
    <p style={{ ...serif, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color, margin: '0 0 1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{text}</p>
  );

  return (
    <>
      <Head>
        <title>Trump Fuckupometer™ — The Long Memo</title>
        <meta name="description" content="For when 'drill baby drill' meets a little excursion/war. Live WTI crude, war cost, and what it's costing you." />
        <meta property="og:title" content="Trump Fuckupometer™ — The Long Memo" />
        <meta property="og:description" content={`Day ${dayCount}. WTI: $${price.toFixed(2)}/bbl. War cost: ${fmtCost(liveCost)} and counting.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{FONTS}</style>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛢️</text></svg>"/>
      </Head>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" onReady={() => setChartReady(true)}/>

      {showShare && <ShareCard price={price.toFixed(2)} sinceInaugPct={data?.sinceInaugurationPct ?? '~25'} fuckupFactor={fuckupFactor.toFixed(1)} dayCount={dayCount} onClose={() => setShowShare(false)}/>}

      <div style={{ minHeight: '100vh', background: T.slateDk, color: 'rgba(245,241,235,0.9)' }}>

        {/* ── Masthead ──────────────────────────────────────────────────────── */}
        <div style={{ background: '#0D1923', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '52px' }}>
            <a href="https://thelongmemo.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img src="/tlm-logo.png" alt="TLM" style={{ height: '30px', width: '30px', borderRadius: '3px' }}/>
              <img src="/tlm-wordmark-dark.png" alt="The Long Memo" style={{ height: '20px', opacity: 0.75 }}/>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {lastUpdated && <span style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.25)', letterSpacing: '0.04em' }}>Updated {lastUpdated.toLocaleTimeString()}</span>}
              <button onClick={() => setShowShare(true)} style={{ background: 'none', border: '1px solid rgba(184,92,56,0.4)', borderRadius: '2px', padding: '3px 11px', fontSize: '10px', cursor: 'pointer', color: T.terraM, ...serif, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Share</button>
              <button onClick={fetchAll}               style={{ background: 'none', border: '1px solid rgba(184,92,56,0.4)', borderRadius: '2px', padding: '3px 11px', fontSize: '10px', cursor: 'pointer', color: T.terraM, ...serif, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Refresh</button>
            </div>
          </div>
        </div>

        {/* ── Dark hero ─────────────────────────────────────────────────────── */}
        <div style={{ background: '#0D1923', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '3rem 1.5rem 0' }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <p style={{ ...serif, margin: '0 0 0.5rem', fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: T.terra }}>
                Live Market Intelligence · Operation Epic Fury
              </p>
              <h1 style={{ ...display, fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontStyle: 'italic', margin: '0 0 0.5rem', lineHeight: 1, color: 'rgba(245,241,235,0.95)', letterSpacing: '-0.02em' }}>
                Trump Fuckupometer™
              </h1>
              <p style={{ ...display, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontStyle: 'italic', margin: '0 0 0.25rem', color: T.red }}>
                Day {dayCount} of Operation Epic Fury
              </p>
              <p style={{ ...serif, fontSize: '12px', color: 'rgba(245,241,235,0.35)', margin: 0 }}>
                commenced Feb 28, 2026 · &quot;drill baby drill&quot; · WTI indexed to Jan 20, 2025 baseline
              </p>
            </div>

            {/* Three big hero stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1px' }}>
              {/* WTI live */}
              <div style={{ background: '#111D2B', padding: '2rem 1.5rem', textAlign: 'center', borderTop: `4px solid ${T.terra}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.red, display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }}/>
                  <span style={{ ...serif, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.terra }}>WTI Crude — Live</span>
                </div>
                <p className="live-counter" style={{ ...display, margin: '0 0 4px', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: 'rgba(245,241,235,0.95)', lineHeight: 1 }}>
                  {loading ? '—' : `$${parseFloat(data.price).toFixed(2)}`}
                </p>
                <p style={{ ...serif, margin: '0 0 8px', fontSize: '13px', color: isUp ? T.terra : T.green }}>
                  {data ? `${isUp ? '▲' : '▼'} ${data.changePct}% today` : ''}
                </p>
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '11px', color: 'rgba(245,241,235,0.35)' }}>Inauguration baseline</p>
                  <p style={{ ...display, margin: '0 0 4px', fontSize: '1.1rem', color: T.green }}>$76.00</p>
                  <p style={{ ...serif, margin: 0, fontSize: '11px', fontWeight: 600, color: T.terra }}>+{data ? data.sinceInaugurationPct : '~25'}% since 1/20/25</p>
                </div>
              </div>

              {/* War cost live counter */}
              <div style={{ background: '#111D2B', padding: '2rem 1.5rem', textAlign: 'center', borderTop: `4px solid ${T.red}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: T.red, display: 'inline-block', animation: 'pulse-dot 1s ease-in-out infinite' }}/>
                  <span style={{ ...serif, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.red }}>War Cost — Ticking</span>
                </div>
                <p className="live-counter" style={{ ...display, margin: '0 0 4px', fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', color: T.red, lineHeight: 1 }}>
                  {fmtCost(liveCost)}
                </p>
                <p style={{ ...serif, margin: '0 0 8px', fontSize: '11px', color: 'rgba(245,241,235,0.35)' }}>~$2,546 / second (sustained)</p>
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '10px', color: 'rgba(245,241,235,0.35)' }}>Pentagon confirmed Day 1–6</p>
                  <p style={{ ...display, margin: '0 0 3px', fontSize: '1.1rem', color: 'rgba(245,241,235,0.7)' }}>$11.3B</p>
                  <p style={{ ...serif, margin: 0, fontSize: '10px', color: 'rgba(245,241,235,0.3)', fontStyle: 'italic' }}>CSIS + Pentagon, Mar 5</p>
                </div>
              </div>

              {/* Hormuz */}
              <div style={{ background: '#111D2B', padding: '2rem 1.5rem', textAlign: 'center', borderTop: `4px solid ${T.red}` }}>
                <p style={{ ...serif, margin: '0 0 8px', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.red }}>Hormuz — Transit Closed</p>
                <p style={{ ...display, margin: '0 0 4px', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', color: T.red, lineHeight: 1 }}>95%</p>
                <p style={{ ...serif, margin: '0 0 8px', fontSize: '12px', color: 'rgba(245,241,235,0.45)' }}>of tanker transits — gone</p>
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '10px', color: 'rgba(245,241,235,0.35)' }}>Ships struck since Feb 28</p>
                  <p style={{ ...display, margin: '0 0 3px', fontSize: '1.1rem', color: T.terra }}>13+</p>
                  <p style={{ ...serif, margin: 0, fontSize: '10px', color: 'rgba(245,241,235,0.3)', fontStyle: 'italic' }}>S&P Global / Kpler / USNI</p>
                </div>
              </div>
            </div>

            {/* Brent + Crisis peak supplemental row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: 0 }}>
              <div style={{ background: '#111D2B', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)' }}>Brent Crude — Live</p>
                  <p className="live-counter" style={{ ...display, margin: 0, fontSize: '1.4rem', color: 'rgba(245,241,235,0.8)', lineHeight: 1 }}>{data?.brent ? `$${parseFloat(data.brent.price).toFixed(2)}` : '—'}</p>
                </div>
                {data?.brent && <p style={{ ...serif, margin: 0, fontSize: '11px', color: parseFloat(data.brent.change) >= 0 ? T.terra : T.green }}>{parseFloat(data.brent.change) >= 0 ? '▲' : '▼'} {data.brent.changePct}%</p>}
                {data?.brent && <p style={{ ...serif, margin: 0, fontSize: '11px', fontWeight: 600, color: T.terra }}>+{data.brent.sinceInaugPct}% since 1/20/25</p>}
              </div>
              <div style={{ background: '#111D2B', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.35)' }}>Crisis Peak — Mar 9</p>
                  <p style={{ ...display, margin: 0, fontSize: '1.4rem', color: T.red, lineHeight: 1 }}>$119.48</p>
                </div>
                <p style={{ ...serif, margin: 0, fontSize: '11px', color: 'rgba(245,241,235,0.4)' }}>Israel strikes 30 Iranian oil depots</p>
              </div>
            </div>

            {/* Oil journey visual */}
            <OilJourney price={price}/>
            {/* Hormuz bar */}
            <HormuzBar/>
          </div>
        </div>

        {/* ── Content area ──────────────────────────────────────────────────── */}
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 1.5rem' }}>

          {error && <div style={{ background: 'rgba(184,92,56,0.15)', border: `1px solid ${T.terra}44`, borderRadius: '2px', padding: '10px 14px', margin: '1.5rem 0', ...serif, fontSize: '13px', color: T.terraM }}>{error}</div>}

          {/* Fuckupometer gauge */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', margin: '1.5rem 0' }}>
            {sectionLabel('Fuckupometer™ — Real-Time Reading')}
            <Gauge pct={fuckupFactor}/>
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ ...serif, fontSize: '14px', fontStyle: 'italic', color: 'rgba(245,241,235,0.5)', lineHeight: 1.8, margin: '0 0 4px' }}>
                &quot;We&apos;re going to get the price of energy down… get it down fast… we&apos;re going to drill, baby, drill.&quot;
              </p>
              <p style={{ ...serif, fontSize: '12px', color: 'rgba(245,241,235,0.3)', margin: 0 }}>
                — Donald J. Trump, Inauguration Day, January 20, 2025. &nbsp;
                <span style={{ color: T.terra, fontWeight: 600 }}>WTI that day: $76. Today: ${price.toFixed(2)}.</span>
              </p>
            </div>
          </div>

          {/* Trump Said */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel('Trump Said vs. Reality', T.red)}
            <TrumpSaid/>
          </div>

          {/* Butcher's Bill */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel("Butcher's Bill — Op. Epic Fury", T.red)}
            <p style={{ ...serif, fontSize: '12px', color: 'rgba(245,241,235,0.3)', margin: '0 0 1.25rem', fontStyle: 'italic' }}>
              Commenced Feb 28, 2026. Status: ongoing. Iranian figures disputed between UN rep, HRANA, and US administration.
            </p>
            <ButcherBill/>
          </div>

          {/* 30-day chart */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel('WTI Crude — 30-Day Price')}
            <OilChart chartReady={chartReady}/>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.3)' }}>
              <span>── WTI price</span>
              <span>- - Inaug. baseline ($76)</span>
              <span style={{ marginLeft: 'auto' }}>Scenario estimates: ceasefire ~$85 · war +30d ~$105 · Hormuz closed 90d ~$130</span>
            </div>
          </div>

          {/* War economy */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel('War Economy Dashboard')}
            <p style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.45)', margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              What else moves when a Strait closes and a president promises cheap energy.
            </p>
            {commodities ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                {commodities.map((c, i) => <CommodityCard key={i} c={c}/>)}
              </div>
            ) : (
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.25)' }}>Loading commodity data…</div>
            )}
            <p style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.2)', margin: '10px 0 0', fontStyle: 'italic' }}>
              Fertilizer via CF Industries (NYSE: CF). All inauguration baselines from Jan 20, 2025 market close.
            </p>
          </div>

          {/* What this costs you — gas */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel('What the "Excursion" in Iran Is Costing You at the Pump')}
            <p style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.45)', margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              Enter your specs. We&apos;ll do the math vs. inauguration day.
            </p>
            <GasCalc rbobPrice={rbobPrice}/>
          </div>

          {/* Beyond the pump */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel('Beyond the Pump')}
            <p style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.45)', margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              Oil is embedded in the price of nearly everything. Fed research: 10% oil increase → food CPI +0.3%. We&apos;re at +25%.
            </p>
            <BroaderImpact/>
            <p style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.2)', margin: '10px 0 0', fontStyle: 'italic' }}>
              Based on Federal Reserve Board FEDS Notes, Dec 2023. Applied to ~25% WTI increase from inaug. baseline. JPMorgan airfare via CNBC, Mar 11.
            </p>
          </div>

          {/* What it's costing the average American */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel('What This Is Costing the Average American', T.red)}
            <p style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.45)', margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              Pentagon confirmed $11.3B in the first six days. Penn Wharton projects $40–95B for a two-month campaign. Here is what that means per household.
            </p>
            <AverageAmericanCost liveCost={liveCost}/>
            <p style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.2)', margin: '10px 0 0', fontStyle: 'italic' }}>
              Household share = unbudgeted cost ÷ 132M US households (Census 2024). Penn Wharton range: $40B–$95B direct; $50B–$210B total economic impact.
            </p>
          </div>

          {/* What it could have bought */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel(`What ${fmtCost(liveCost)} Would Have Bought`)}
            <p style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.45)', margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              At the current live war cost estimate. Not a policy argument. Arithmetic.
            </p>
            <WhatItCouldBuy liveCost={liveCost}/>
            <p style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.2)', margin: '10px 0 0', fontStyle: 'italic' }}>
              All figures use the live war cost estimate above. Sources listed per card. The Long Memo does not take positions on whether the war should be fought. We do math.
            </p>
          </div>

          {/* Incident log */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel('Incident Log')}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <span style={{ ...serif, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.terra, fontWeight: 600 }}>2025</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}/>
            </div>
            <Timeline events={EVENTS_2025}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.5rem 0 1rem' }}>
              <span style={{ ...serif, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.terra, fontWeight: 600 }}>2026</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}/>
            </div>
            <Timeline events={EVENTS_2026}/>
          </div>

          {/* Why this matters */}
          <div style={{ background: '#111D2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '2px', padding: '2rem', marginBottom: '1.5rem' }}>
            {sectionLabel('Why This Matters')}
            <p style={{ ...serif, fontSize: '14px', color: 'rgba(245,241,235,0.55)', lineHeight: 1.85, margin: '0 0 1rem', fontWeight: 300 }}>
              The Strait of Hormuz handles approximately 20% of global oil flow. Its effective closure — triggered by the US–Iran conflict that began February 28 — has produced a supply shock that US domestic production cannot remedy on any relevant timeline. The shale patch surrendered drilling capacity when oil sat at $55 in late 2025. Those rigs do not return in weeks.
            </p>
            <p style={{ ...serif, fontSize: '14px', color: 'rgba(245,241,235,0.55)', lineHeight: 1.85, margin: 0, fontWeight: 300 }}>
              The IEA&apos;s 400-million-barrel emergency release — the largest in history — stabilized prices briefly before fresh Hormuz attacks pushed them back up. The EIA now forecasts Brent above $95 through Q2 2026. Fertilizer prices matter because urea is a natural gas derivative: energy shocks travel directly into food production costs with a one-to-two season lag.
            </p>
          </div>

          {/* CTA */}
          <div style={{ background: `linear-gradient(135deg, #0D1923 0%, #1A2535 100%)`, borderRadius: '2px', padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem', border: `1px solid rgba(184,92,56,0.3)`, borderTop: `3px solid ${T.terra}` }}>
            <p style={{ ...display, fontSize: '1.6rem', fontStyle: 'italic', color: 'rgba(245,241,235,0.9)', margin: '0 0 8px' }}>Want the actual analysis?</p>
            <p style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.4)', margin: '0 0 1.25rem' }}>Read The Long Memo — institutional analysis for people who need to know what&apos;s actually happening.</p>
            <a href="https://thelongmemo.com" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '10px 28px', background: 'transparent', color: T.terraM, border: `1px solid ${T.terra}`, borderRadius: '2px', fontSize: '12px', textDecoration: 'none', ...serif, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Read The Long Memo →
            </a>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem', paddingBottom: '2rem' }}>
            <p style={{ ...serif, fontSize: '11px', color: 'rgba(245,241,235,0.2)', lineHeight: 1.8, margin: '0 0 10px' }}>
              Data: WTI (CL=F), Brent (BZ=F), Natural Gas (NG=F), Gasoline (RB=F), Wheat (ZW=F), Corn (ZC=F), CF Industries (CF) via Yahoo Finance. War cost estimate: Pentagon / CSIS methodology. Refreshes every five minutes. Not financial advice. This is a gag. A very accurate gag.
              &nbsp;·&nbsp;<a href="https://thelongmemo.com" style={{ color: 'rgba(245,241,235,0.2)' }}>The Long Memo</a>
              &nbsp;·&nbsp;<em>Heckuva job, Trumpy!</em>
            </p>
            <p style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.12)', textAlign: 'center', letterSpacing: '0.06em', margin: 0 }}>
              FOR SATIRICAL PURPOSES ONLY // NOT AFFILIATED WITH THE UNITED STATES GOVERNMENT
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
