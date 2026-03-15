// oil.js — WTI + Brent live quotes via stooq (replaces Yahoo Finance)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const STOOQ_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  async function fetchStooq(ticker) {
    const url = `https://stooq.com/q/l/?s=${ticker}&f=sd2t2ohlcp&h&e=csv`;
    const r = await fetch(url, { headers: STOOQ_HEADERS });
    if (!r.ok) throw new Error(`Stooq returned ${r.status} for ${ticker}`);
    const text = await r.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error(`No data rows for ${ticker}`);
    const headers = lines[0].split(',');
    const values  = lines[1].split(',');
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] || '').trim(); });
    if (!row.Close || row.Close === 'N/D') throw new Error(`N/D for ${ticker}`);
    const price    = parseFloat(row.Close);
    const prev     = parseFloat(row.Prev || row.Close);
    const change   = price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;
    return {
      price:     price.toFixed(2),
      prevClose: prev.toFixed(2),
      change:    change.toFixed(2),
      changePct: changePct.toFixed(2),
      dayHigh:   row.High  ? parseFloat(row.High).toFixed(2)  : null,
      dayLow:    row.Low   ? parseFloat(row.Low).toFixed(2)   : null,
    };
  }

  try {
    const [wti, brent] = await Promise.all([
      fetchStooq('cl.f'),   // WTI crude
      fetchStooq('cb.f'),   // Brent crude
    ]);

    const INAUGURATION_PRICE = 76.0;
    const ALL_TIME_PEAK      = 119.48;
    const BRENT_INAUG        = 79.0;

    const price = parseFloat(wti.price);

    res.json({
      ...wti,
      inaugurationPrice:    INAUGURATION_PRICE,
      peakPrice:            ALL_TIME_PEAK,
      sinceInauguration:    (price - INAUGURATION_PRICE).toFixed(2),
      sinceInaugurationPct: (((price - INAUGURATION_PRICE) / INAUGURATION_PRICE) * 100).toFixed(1),
      fuckupFactor:         Math.min(100, Math.max(0, ((price - INAUGURATION_PRICE) / (ALL_TIME_PEAK - INAUGURATION_PRICE)) * 100)).toFixed(1),
      brent: {
        ...brent,
        sinceInaugPct: (((parseFloat(brent.price) - BRENT_INAUG) / BRENT_INAUG) * 100).toFixed(1),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
