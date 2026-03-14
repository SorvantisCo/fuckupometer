export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  try {
    const [wtiRes, brentRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=1mo',
        { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1d&range=1mo',
        { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }),
    ]);

    const [wtiData, brentData] = await Promise.all([wtiRes.json(), brentRes.json()]);

    const parsePoints = (data) => {
      const result = data?.chart?.result?.[0];
      if (!result) return [];
      return result.timestamp.map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().slice(0, 10),
        close: result.indicators.quote[0].close[i]
          ? parseFloat(result.indicators.quote[0].close[i].toFixed(2))
          : null,
      })).filter(p => p.close !== null);
    };

    res.json({
      points: parsePoints(wtiData),
      brentPoints: parsePoints(brentData),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
