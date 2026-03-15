// oil.js — WTI + Brent via Yahoo Finance v8 (returns marketState for open/closed display)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Short cache when market is open, longer when closed
  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=300');

  const YF_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json',
  };

  async function fetchYF(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const r = await fetch(url, { headers: YF_HEADERS });
    if (!r.ok) throw new Error(`Yahoo Finance returned ${r.status} for ${symbol}`);
    const json = await r.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error(`No meta for ${symbol}`);

    const price = meta.regularMarketPrice;
    // For futures: use chartPreviousClose (previousClose is unreliable for /=F symbols)
    const prev  = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;

    // marketState: "REGULAR" (open), "PRE", "POST", null/undefined (closed weekend/holiday)
    const marketState = meta.marketState ?? 'CLOSED';

    // Last trade timestamp
    const lastTradeTs  = meta.regularMarketTime; // Unix seconds
    const lastTradeISO = lastTradeTs ? new Date(lastTradeTs * 1000).toISOString() : null;

    return {
      price:       price.toFixed(2),
      prevClose:   prev.toFixed(2),
      change:      change.toFixed(2),
      changePct:   changePct.toFixed(2),
      dayHigh:     meta.regularMarketDayHigh?.toFixed(2) ?? null,
      dayLow:      meta.regularMarketDayLow?.toFixed(2)  ?? null,
      marketState,
      lastTradeISO,
    };
  }

  try {
    const [wti, brent] = await Promise.all([
      fetchYF('CL=F'),   // WTI crude
      fetchYF('BZ=F'),   // Brent crude
    ]);

    const INAUGURATION_PRICE = 76.0;
    const ALL_TIME_PEAK      = 119.48;
    const BRENT_INAUG        = 79.0;

    const price = parseFloat(wti.price);
    const marketOpen = wti.marketState === 'REGULAR';

    res.json({
      ...wti,
      inaugurationPrice:    INAUGURATION_PRICE,
      peakPrice:            ALL_TIME_PEAK,
      sinceInauguration:    (price - INAUGURATION_PRICE).toFixed(2),
      sinceInaugurationPct: (((price - INAUGURATION_PRICE) / INAUGURATION_PRICE) * 100).toFixed(1),
      fuckupFactor:         Math.min(100, Math.max(0, ((price - INAUGURATION_PRICE) / (ALL_TIME_PEAK - INAUGURATION_PRICE)) * 100)).toFixed(1),
      marketOpen,
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
