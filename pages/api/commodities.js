// commodities.js — commodity quotes via stooq (replaces Yahoo Finance)
const COMMODITIES = [
  { ticker: 'ng.f',  label: 'Natural Gas',     unit: '$/MMBtu', inaugBaseline: 3.22,  decimals: 3 },
  { ticker: 'rb.f',  label: 'Gasoline (RBOB)',  unit: '$/gal',   inaugBaseline: 2.10,  decimals: 4 },
  { ticker: 'zw.f',  label: 'Wheat',            unit: 'cents/bu', inaugBaseline: 535,  decimals: 2 },
  { ticker: 'zc.f',  label: 'Corn',             unit: 'cents/bu', inaugBaseline: 450,  decimals: 2 },
  { ticker: 'cf.us', label: 'Fertilizer',       unit: '$/sh',    inaugBaseline: 110,   decimals: 2 },
];

const STOOQ_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function fetchStooq(ticker, decimals) {
  const url = `https://stooq.com/q/l/?s=${ticker}&f=sd2t2ohlcp&h&e=csv`;
  const r = await fetch(url, { headers: STOOQ_HEADERS });
  if (!r.ok) return null;
  const text = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  const headers = lines[0].split(',');
  const values  = lines[1].split(',');
  const row = {};
  headers.forEach((h, i) => { row[h.trim()] = (values[i] || '').trim(); });
  if (!row.Close || row.Close === 'N/D') return null;
  const price    = parseFloat(row.Close);
  const prev     = parseFloat(row.Prev || row.Close);
  const change   = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    price:     parseFloat(price.toFixed(decimals)),
    prev:      parseFloat(prev.toFixed(decimals)),
    change:    parseFloat(change.toFixed(decimals)),
    changePct: parseFloat(changePct.toFixed(2)),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const results = await Promise.all(
      COMMODITIES.map(async (c) => {
        const quote = await fetchStooq(c.ticker, c.decimals);
        if (!quote) return null;
        const sinceInaugPct = ((quote.price - c.inaugBaseline) / c.inaugBaseline * 100).toFixed(1);
        // Return with original Yahoo-style ticker alias so front-end keeps working
        const tickerAlias = {
          'ng.f':  'NG=F',
          'rb.f':  'RB=F',
          'zw.f':  'ZW=F',
          'zc.f':  'ZC=F',
          'cf.us': 'CF',
        }[c.ticker] || c.ticker;
        return { ...c, ticker: tickerAlias, ...quote, sinceInaugPct: parseFloat(sinceInaugPct) };
      })
    );

    res.json({ commodities: results.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
