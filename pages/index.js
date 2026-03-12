import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';

const EVENTS = [
  { date: 'Jan 20', color: '#00cc44', label: 'Inauguration. "Drill baby drill." WTI: ~$76. Gold star promised.' },
  { date: 'Feb 10', color: '#aacc00', label: 'US-Iran nuclear talks in Oman. Markets briefly believe it. WTI dips to ~$63.' },
  { date: 'Feb 28', color: '#ff6600', label: 'Operation Epic Fury begins. 900 US-Israeli strikes in first 12 hours. Khamenei killed. Strait closure begins.' },
  { date: 'Mar 1',  color: '#ff4400', label: 'First 3 US KIA confirmed. Iran retaliates across the Gulf. WTI spikes.' },
  { date: 'Mar 2',  color: '#ff2200', label: 'US embassy in Kuwait struck. Girls school in Minab hit — 148+ dead (disputed). 6 more US KIA in Kuwait.' },
  { date: 'Mar 9',  color: '#ff0000', label: '🔥 Israel bombs 30 Iranian oil depots. WTI: $119.48 — 3.75-year high. Trump: "Over soon."' },
  { date: 'Mar 11', color: '#ff4400', label: 'IEA emergency release: 400M barrels — largest in history. 3 vessels hit in Strait anyway.' },
  { date: 'Mar 12', color: '#ff0000', label: 'TODAY. WTI: live above. The war is apparently not over.' },
];

// Butcher's bill — sourced from Pentagon, Al Jazeera, Britannica, HRANA as of Mar 12
const BUTCHERS_BILL = [
  { label: 'US KIA',          value: '7',        note: 'Pentagon confirmed (incl. 1 non-combat)', color: '#ff4444', src: 'Pentagon / Al Jazeera, Mar 10' },
  { label: 'US WIA',          value: '~140',     note: '108 returned to duty; 8 remain severe', color: '#ff8844', src: 'Pentagon, Mar 10' },
  { label: 'Iranian deaths',  value: '1,250+',   note: 'Confirmed. HRANA est. up to 7,000. Trump admin claims 32,000.', color: '#ff4444', src: 'Al Jazeera / Britannica, Mar 12' },
  { label: 'Civilian dead',   value: '742+',     note: 'Human Rights Activists in Iran estimate; Iranian Red Crescent: 600+', color: '#ff8844', src: 'HRANA / IRC, Mar 3' },
  { label: 'School strike',   value: '148–180',  note: 'Girls school, Minab. US disputes intentionality.', color: '#ffaa00', src: 'Iranian govt / Britannica (disputed)' },
  { label: 'Regional civs',   value: 'Dozens',   note: 'UAE, Kuwait, Saudi, Bahrain — Iranian retaliatory strikes', color: '#ffaa00', src: 'Reuters / official statements' },
];

function HorizontalThermometer({ fuckupFactor }) {
  const pct = Math.min(100, Math.max(0, fuckupFactor));

  const zones = [
    { pct: 0,   label: 'NOT\nFUCKED UP',                  color: '#00cc44', activeColor: '#00ff55' },
    { pct: 25,  label: 'A LITTLE\nFUCKED UP',             color: '#aacc00', activeColor: '#ddff00' },
    { pct: 50,  label: 'SIGNIFICANTLY\nFUCKED UP',        color: '#ff6600', activeColor: '#ff8833' },
    { pct: 75,  label: 'VERY\nFUCKED UP',                 color: '#ff2200', activeColor: '#ff4422' },
    { pct: 100, label: 'COMPLETELY\nUNBELIEVABLY\nFUCKED UP', color: '#ff0000', activeColor: '#ff2200' },
  ];

  // Active zone = highest zone whose pct threshold is <= current pct
  const activeIdx = zones.reduce((best, z, i) => (pct >= z.pct ? i : best), 0);
  const mercuryColor = zones[activeIdx].activeColor;

  return (
    <div style={{ width: '100%', padding: '0.5rem 0 1rem' }}>

      {/* Zone labels above — active one lights up */}
      <div style={{ position: 'relative', height: '58px', marginBottom: '8px' }}>
        {zones.map((z, i) => {
          const isActive = i === activeIdx;
          return (
            <div key={z.pct} style={{
              position: 'absolute',
              left: i === zones.length - 1 ? 'auto' : `${z.pct}%`,
              right: i === zones.length - 1 ? '0' : 'auto',
              transform: i === 0 ? 'none' : i === zones.length - 1 ? 'none' : 'translateX(-50%)',
              textAlign: i === 0 ? 'left' : i === zones.length - 1 ? 'right' : 'center',
              fontSize: isActive ? '11px' : '9px',
              fontFamily: 'Courier New, monospace',
              color: isActive ? z.activeColor : '#3a5a3a',
              fontWeight: isActive ? 700 : 400,
              letterSpacing: isActive ? '0.08em' : '0.04em',
              whiteSpace: 'pre',
              lineHeight: 1.35,
              textShadow: isActive ? `0 0 10px ${z.activeColor}cc` : 'none',
              transition: 'all 0.6s ease',
              padding: isActive ? '2px 6px' : '2px 0',
              background: isActive ? `${z.activeColor}11` : 'none',
              border: isActive ? `1px solid ${z.activeColor}44` : '1px solid transparent',
              borderRadius: '3px',
            }}>
              {z.label}
            </div>
          );
        })}
      </div>

      {/* Track — full width, no ball */}
      <div style={{ position: 'relative', height: '22px' }}>
        <div style={{
          position: 'absolute', inset: '0 0 0 0',
          height: '22px', borderRadius: '3px',
          background: '#0a1a0a',
          border: '1px solid #1a4a1a',
          overflow: 'hidden',
        }}>
          {/* Zone background tint */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #003300 0%, #1a4400 25%, #443300 50%, #551100 75%, #440000 100%)', opacity: 0.4 }}/>
          {/* Mercury */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${zones[0].color}, ${mercuryColor})`,
            boxShadow: `0 0 14px ${mercuryColor}99, inset 0 1px 0 rgba(255,255,255,0.15)`,
            transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.8s',
          }}/>
          {/* Zone dividers */}
          {zones.slice(1, -1).map(z => (
            <div key={z.pct} style={{
              position: 'absolute', left: `${z.pct}%`, top: 0, bottom: 0,
              width: '1px', background: 'rgba(0,0,0,0.5)',
            }}/>
          ))}
        </div>
      </div>

      {/* Tick marks below track */}
      <div style={{ position: 'relative', height: '6px', marginTop: '2px' }}>
        {zones.map((z, i) => (
          <div key={z.pct} style={{
            position: 'absolute',
            left: i === zones.length - 1 ? 'auto' : `${z.pct}%`,
            right: i === zones.length - 1 ? '0' : 'auto',
            top: 0, width: '1px', height: '6px',
            background: i === activeIdx ? zones[activeIdx].activeColor : '#1a4a1a',
            transform: i > 0 && i < zones.length - 1 ? 'translateX(-50%)' : 'none',
          }}/>
        ))}
      </div>

      {/* Reading line */}
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <span style={{
          fontFamily: 'Courier New, monospace',
          fontSize: '12px', letterSpacing: '0.1em',
          color: mercuryColor,
          textShadow: `0 0 10px ${mercuryColor}`,
          fontWeight: 700,
        }}>
          FUCKUP READING: {pct.toFixed(1)}% OF MAXIMUM RECORDED CHAOS
        </span>
      </div>
    </div>
  );
}

function OilChart({ chartReady }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  useEffect(() => {
    if (!chartReady || !canvasRef.current) return;
    let cancelled = false;
    fetch('/api/history').then(r => r.json()).then(data => {
      if (cancelled || !data.points || !canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const labels = data.points.map(p => {
        const d = new Date(p.date + 'T12:00:00Z');
        return `${d.getUTCMonth()+1}/${d.getUTCDate()}`;
      });
      const values = data.points.map(p => p.close);
      chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'WTI $/bbl',
              data: values,
              borderColor: '#00ff44',
              backgroundColor: 'rgba(0,255,68,0.06)',
              borderWidth: 2,
              pointRadius: 2,
              pointBackgroundColor: '#00ff44',
              tension: 0.35,
              fill: true,
            },
            {
              label: 'Inauguration baseline',
              data: labels.map(() => 76),
              borderColor: '#ff6600',
              borderWidth: 1.5,
              borderDash: [5, 4],
              pointRadius: 0,
              fill: false,
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.dataset.label.includes('baseline') ? ' Inaug. baseline: $76' : ` $${c.parsed.y.toFixed(2)}/bbl` } } },
          scales: {
            y: { min: 55, max: 130, ticks: { callback: v => '$'+v, color: '#336633', font: { size: 10, family: 'Courier New' } }, grid: { color: 'rgba(0,100,0,0.15)' }, border: { color: '#1a4a1a' } },
            x: { ticks: { color: '#336633', font: { size: 9, family: 'Courier New' }, maxRotation: 30, autoSkip: true, maxTicksLimit: 12 }, grid: { display: false }, border: { color: '#1a4a1a' } }
          }
        }
      });
    });
    return () => { cancelled = true; };
  }, [chartReady]);
  return <div style={{ position: 'relative', width: '100%', height: '200px' }}><canvas ref={canvasRef}/></div>;
}

function CommodityCard({ c }) {
  const isUp   = c.changePct >= 0;
  const since  = c.sinceInaugPct >= 0;
  return (
    <div style={{ background: '#040d04', border: '1px solid #1a4a1a', borderRadius: '4px', padding: '0.75rem', fontFamily: 'Courier New, monospace' }}>
      <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#88aa88', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{c.label}</p>
      {c.note && <p style={{ margin: '0 0 4px', fontSize: '9px', color: '#6a8a6a', fontStyle: 'italic' }}>{c.note}</p>}
      <p style={{ margin: '0 0 3px', fontSize: '1.2rem', fontWeight: 700, color: '#00ff44', textShadow: '0 0 6px #00ff4488' }}>
        {c.unit === '$/gal' ? `$${c.price}` : c.unit.startsWith('cents') ? `${c.price}¢` : `$${c.price}`}
      </p>
      <p style={{ margin: '0 0 1px', fontSize: '10px', color: isUp ? '#ff4444' : '#00cc44' }}>{isUp ? '▲' : '▼'} {Math.abs(c.changePct)}% today</p>
      <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: since ? '#ff6600' : '#00cc44' }}>{since ? '+' : ''}{c.sinceInaugPct}% since inaug.</p>
    </div>
  );
}

function BillRow({ item }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: '1px solid #0d2a0d', fontFamily: 'Courier New, monospace' }}>
      <div style={{ minWidth: '130px' }}>
        <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#88aa88', textTransform: 'uppercase' }}>{item.label}</span>
      </div>
      <div style={{ minWidth: '80px' }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: item.color, textShadow: `0 0 8px ${item.color}66` }}>{item.value}</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#aaaaaa', lineHeight: 1.5 }}>{item.note}</p>
        <p style={{ margin: 0, fontSize: '9px', color: '#6a8a6a', letterSpacing: '0.04em' }}>SRC: {item.src}</p>
      </div>
    </div>
  );
}

const SCANLINE_STYLE = `
  body { margin: 0; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:0.97} 95%{opacity:0.99} }
  .blink { animation: blink 1s step-end infinite; }
  .screen { animation: flicker 8s infinite; }
  ::-webkit-scrollbar { width: 6px; background: #020802; }
  ::-webkit-scrollbar-thumb { background: #1a4a1a; border-radius: 3px; }
  ::selection { background: #00ff4433; }
  /* Legibility helpers */
  .dim  { color: #5a7a5a; }   /* timestamps, source tags */
  .mid  { color: #88aa88; }   /* secondary body text */
  .body { color: #b8d4b8; }   /* primary body text */
  .hot  { color: #00ff44; }   /* bright green accent */
`;

export default function Home() {
  const [data,        setData]        = useState(null);
  const [commodities, setCommodities] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);
  const [chartReady,  setChartReady]  = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [oilRes, comRes] = await Promise.all([fetch('/api/oil'), fetch('/api/commodities')]);
      const [oil, com] = await Promise.all([oilRes.json(), comRes.json()]);
      setData(oil); setCommodities(com.commodities);
      setLastUpdated(new Date()); setError(null);
    } catch { setError('UPLINK FAILURE — MARKETS MAY BE CLOSED'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const price        = data ? parseFloat(data.price)        : 96.34;
  const fuckupFactor = data ? parseFloat(data.fuckupFactor) : 47;
  const isUp         = data ? parseFloat(data.change) >= 0  : true;

  const getRating = p =>
    p >= 75 ? 'MAXIMUM FUCKUP'      :
    p >= 50 ? 'SIGNIFICANT FUCKUP'  :
    p >= 25 ? 'ELEVATED FUCKUP'     :
              'MANAGEABLE FUCKUP';
  const ratingColor = fuckupFactor >= 75 ? '#ff2200' : fuckupFactor >= 50 ? '#ff6600' : fuckupFactor >= 25 ? '#aacc00' : '#00cc44';

  const S = {
    section: { background: '#020d02', border: '1px solid #1a4a1a', borderRadius: '4px', padding: '1.25rem 1.5rem', marginBottom: '1rem' },
    sectionHead: { fontFamily: 'Courier New, monospace', fontSize: '11px', letterSpacing: '0.12em', color: '#88aa88', textTransform: 'uppercase', margin: '0 0 1rem', borderBottom: '1px solid #0d2a0d', paddingBottom: '8px' },
    mono: { fontFamily: 'Courier New, monospace' },
  };

  return (
    <>
      <Head>
        <title>TRUMP FUCKUPOMETER™ // OPERATION EPIC FURY</title>
        <meta name="description" content="For when 'drill baby drill' meets a little excursion/war." />
        <meta property="og:title" content="Trump Fuckupometer™ // Op. Epic Fury" />
        <meta property="og:description" content={`WTI: $${price.toFixed(2)}/bbl — ${data?.sinceInaugurationPct ?? '~27'}% above Inauguration Day baseline.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{SCANLINE_STYLE}</style>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛢️</text></svg>"/>
      </Head>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" onReady={() => setChartReady(true)}/>

      <div className="screen" style={{ minHeight: '100vh', background: '#010901', color: '#00cc44', fontFamily: 'Courier New, monospace', position: 'relative' }}>

        {/* CRT scanline overlay */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)', backgroundSize: '100% 4px' }}/>

        {/* Header */}
        <div style={{ borderBottom: '1px solid #1a4a1a', background: '#010d01', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '10px', letterSpacing: '0.15em', color: '#00ff44', textShadow: '0 0 8px #00ff44' }}>UNCLASSIFIED // SATIRICAL PURPOSES ONLY</span>
            <span style={{ fontSize: '10px', color: '#3a5a3a' }}>|</span>
            <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#88aa88' }}>THE LONG MEMO // INTELLIGENCE DIVISION</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px' }}>
            <span style={{ color: '#ff2200', letterSpacing: '0.1em' }} className="blink">● LIVE</span>
            <span style={{ color: '#3a5a3a' }}>|</span>
            <span style={{ color: '#88aa88' }}>{lastUpdated ? `UPLINK: ${lastUpdated.toLocaleTimeString()}` : 'CONNECTING...'}</span>
            <button onClick={fetchAll} style={{ background: 'none', border: '1px solid #1a4a1a', borderRadius: '2px', padding: '2px 8px', fontSize: '10px', cursor: 'pointer', color: '#88aa88', fontFamily: 'Courier New, monospace', letterSpacing: '0.06em' }}>↻ REFRESH</button>
          </div>
        </div>

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 1.5rem' }}>

          {/* Title block */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '1.5rem', background: '#010d01', border: '1px solid #1a4a1a', borderRadius: '4px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: '#5a7a5a', marginBottom: '8px' }}>// SITUATION REPORT // MAR 12, 2026 //</div>
            <h1 style={{ fontFamily: 'Courier New, monospace', fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.08em', color: '#00ff44', textShadow: '0 0 20px #00ff4466', lineHeight: 1.1 }}>
              TRUMP FUCKUPOMETER™
            </h1>
            <div style={{ fontSize: '11px', letterSpacing: '0.15em', color: '#88aa88', margin: '0 0 8px' }}>OPERATION EPIC FURY // WTI CRUDE OIL INDEX</div>
            <p style={{ fontSize: '14px', color: '#b8d4b8', margin: 0, fontStyle: 'italic' }}>
              For when "drill baby drill" meets a little excursion/war.
            </p>
          </div>

          {error && <div style={{ background: '#1a0000', border: '1px solid #ff2200', borderRadius: '4px', padding: '10px 14px', marginBottom: '1rem', fontSize: '11px', color: '#ff4444', fontFamily: 'Courier New, monospace', letterSpacing: '0.06em' }}>⚠ {error}</div>}

          {/* Hero metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '1rem' }}>
            {[
              {
                label: 'WTI CRUDE // LIVE',
                value: loading ? '——' : `$${parseFloat(data?.price).toFixed(2)}`,
                sub: data ? `${isUp ? '▲' : '▼'} $${Math.abs(parseFloat(data.change)).toFixed(2)} (${isUp?'+':''}${data.changePct}%) TODAY` : '...',
                color: '#00ff44',
              },
              {
                label: 'SINCE INAUGURATION',
                value: `+${data ? data.sinceInaugurationPct : '~27'}%`,
                sub: `+$${data ? data.sinceInauguration : '~20'} VS BASELINE $76`,
                color: '#ff6600',
              },
              {
                label: 'THREAT ASSESSMENT',
                value: getRating(fuckupFactor),
                sub: `PEAK: $119.48 // MAR 9`,
                color: ratingColor,
                small: true,
              },
            ].map((m, i) => (
              <div key={i} style={{ background: '#010d01', border: '1px solid #1a4a1a', borderRadius: '4px', padding: '1rem' }}>
                <p style={{ margin: '0 0 6px', fontSize: '10px', letterSpacing: '0.12em', color: '#5a7a5a' }}>{m.label}</p>
                <p style={{ margin: '0 0 4px', fontSize: m.small ? '0.9rem' : '1.6rem', fontWeight: 700, color: m.color, textShadow: `0 0 10px ${m.color}55`, lineHeight: 1.2, fontFamily: 'Courier New, monospace' }}>{m.value}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#88aa88', letterSpacing: '0.06em' }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Thermometer — CENTERED, FULL WIDTH */}
          <div style={{ ...S.section }}>
            <p style={{ ...S.sectionHead }}>FUCKUPOMETER™ // REAL-TIME GAUGE</p>
            <HorizontalThermometer fuckupFactor={fuckupFactor}/>
            <div style={{ borderTop: '1px solid #0d2a0d', marginTop: '1rem', paddingTop: '1rem', fontSize: '12px', color: '#b8d4b8', fontStyle: 'italic', lineHeight: 1.7 }}>
              "We're going to get the price of energy down... get it down fast... we're going to drill, baby, drill."
              <span style={{ color: '#6a8a6a', fontStyle: 'normal' }}> — Donald J. Trump, Jan 20, 2026</span>
              <br/>
              <span style={{ color: '#ff6600', fontStyle: 'normal', fontWeight: 700 }}>WTI on that day: ~$76. &nbsp;Today: ${price.toFixed(2)}. &nbsp;The excursion/war continues.</span>
            </div>
          </div>

          {/* Two-column: Chart + Butcher's Bill */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
            {/* 30-day chart */}
            <div style={{ ...S.section, marginBottom: 0 }}>
              <p style={{ ...S.sectionHead }}>WTI // 30-DAY PRICE HISTORY</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '9px', color: '#6a8a6a', marginBottom: '10px', letterSpacing: '0.06em' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '14px', height: '2px', background: '#00ff44', display: 'inline-block' }}/> WTI PRICE</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '14px', borderTop: '2px dashed #ff6600', display: 'inline-block' }}/> INAUG. BASELINE</span>
              </div>
              <OilChart chartReady={chartReady}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '9px', color: '#6a8a6a', letterSpacing: '0.06em' }}>
                <span>30 DAYS AGO</span><span>TODAY</span>
              </div>
            </div>

            {/* Butcher's Bill */}
            <div style={{ ...S.section, marginBottom: 0 }}>
              <p style={{ ...S.sectionHead, color: '#ff4444' }}>BUTCHER'S BILL // OP. EPIC FURY</p>
              <div style={{ fontSize: '9px', color: '#ff2200', letterSpacing: '0.08em', marginBottom: '8px' }}>COMMENCED: FEB 28, 2026 // STATUS: ONGOING</div>
              {BUTCHERS_BILL.map((item, i) => <BillRow key={i} item={item}/>)}
              <p style={{ margin: '10px 0 0', fontSize: '9px', color: '#6a8a6a', lineHeight: 1.6, letterSpacing: '0.04em' }}>
                FIGURES AS OF MAR 12. IRANIAN TOTAL CASUALTY FIGURES HEAVILY DISPUTED BETWEEN US GOV'T, IRANIAN STATE MEDIA, AND INDEPENDENT MONITORS. ALL FIGURES FROM OPEN SOURCES.
              </p>
            </div>
          </div>

          {/* War economy commodities */}
          <div style={{ ...S.section }}>
            <p style={{ ...S.sectionHead }}>WAR ECONOMY DASHBOARD // SINCE INAUGURATION</p>
            <p style={{ fontSize: '11px', color: '#88aa88', margin: '0 0 1rem', lineHeight: 1.6 }}>
              WHAT ELSE MOVES WHEN A STRAIT CLOSES AND A PRESIDENT PROMISES CHEAP ENERGY.
            </p>
            {commodities ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                {commodities.map((c, i) => <CommodityCard key={i} c={c}/>)}
              </div>
            ) : (
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#6a8a6a', letterSpacing: '0.1em' }}>FETCHING COMMODITY DATA<span className="blink">_</span></div>
            )}
            <p style={{ fontSize: '9px', color: '#6a8a6a', margin: '12px 0 0', lineHeight: 1.6, letterSpacing: '0.04em' }}>
              FERTILIZER TRACKED VIA CF INDUSTRIES (NYSE: CF) — LARGEST US UREA PRODUCER. UREA = OTC MARKET, NO LIQUID EXCHANGE-TRADED FUTURES. INAUG. BASELINES EST. FROM JAN 20, 2026 MARKET CLOSE.
            </p>
          </div>

          {/* Timeline */}
          <div style={{ ...S.section }}>
            <p style={{ ...S.sectionHead }}>INCIDENT LOG // HOW WE GOT HERE</p>
            {EVENTS.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: i < EVENTS.length - 1 ? '1px solid #0d2a0d' : 'none' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.color, flexShrink: 0, marginTop: '5px', boxShadow: `0 0 6px ${e.color}` }}/>
                <span style={{ fontSize: '10px', color: '#6a8a6a', minWidth: '44px', letterSpacing: '0.06em', paddingTop: '2px' }}>{e.date}</span>
                <span style={{ fontSize: '12px', color: '#aaaaaa', lineHeight: 1.6 }}>{e.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', padding: '1.5rem', background: '#010d01', border: '1px solid #1a4a1a', borderRadius: '4px', marginBottom: '1rem' }}>
            <p style={{ fontSize: '12px', color: '#88aa88', marginBottom: '12px', letterSpacing: '0.06em' }}>WANT THE ACTUAL ANALYSIS? READ THE LONG MEMO.</p>
            <a href="https://thelongmemo.substack.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 28px', background: 'transparent', color: '#00ff44', border: '1px solid #00ff44', borderRadius: '2px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', fontFamily: 'Courier New, monospace', letterSpacing: '0.12em', textShadow: '0 0 8px #00ff4466', boxShadow: '0 0 12px #00ff4422' }}>
              &gt;&gt; READ THE LONG MEMO
            </a>
          </div>

          {/* Footer / Disclaimer */}
          <div style={{ borderTop: '1px solid #0d2a0d', paddingTop: '1rem', fontSize: '10px', color: '#6a8a6a', lineHeight: 1.8, letterSpacing: '0.04em' }}>
            DATA: WTI (CL=F), NG (NG=F), GASOLINE (RB=F), WHEAT (ZW=F), CORN (ZC=F), CF INDUSTRIES (CF) VIA YAHOO FINANCE. REFRESHES EVERY 5 MIN.
            CASUALTY FIGURES: PENTAGON, AL JAZEERA, BRITANNICA, HRANA, USNI NEWS — ALL OPEN SOURCE.
            NOT FINANCIAL ADVICE. THIS IS A GAG. A VERY ACCURATE GAG. &nbsp;·&nbsp;
            <a href="https://thelongmemo.substack.com" style={{ color: '#6a8a6a' }}>THE LONG MEMO</a>
            <br/>
            <span style={{ color: '#88aa88', fontStyle: 'italic' }}>Heckuva job, Trumpy!</span>
            &nbsp;&nbsp;<span style={{ color: '#223322' }}>UNCLASSIFIED // FOR SATIRICAL PURPOSES ONLY // NOT AFFILIATED WITH THE UNITED STATES GOVERNMENT</span>
          </div>
        </div>
      </div>
    </>
  );
}
