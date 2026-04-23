// Scatter + box plot: CalEnviroScreen pollution-burden percentile by 1937 HOLC
// grade, one dot per Oakland census tract. Data precomputed in
// data/burden_by_grade.json (CES 4.0 tracts joined to HOLC polygons by
// tract-centroid containment).

(function () {
  const svg = document.getElementById('burden-svg');
  if (!svg) return;

  const W = 960, H = 420;
  const M = { top: 30, right: 20, bottom: 50, left: 60 };
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;

  const GRADES = ['A', 'B', 'C', 'D'];
  const GRADE_LABEL = {
    A: 'A — "Best"',
    B: 'B — "Still Desirable"',
    C: 'C — "Declining"',
    D: 'D — "Hazardous"',
  };
  const GRADE_COLOR = {
    A: '#9dc6a4',   // sage — clean breath
    B: '#a4d2ea',   // sky  — air
    C: '#d9b77a',   // amber — warming haze
    D: '#e2958e',   // coral — burdened
  };
  const INK       = '#dde6ef';
  const INK_SOFT  = '#8ea2b8';
  const GRID      = 'rgba(168, 204, 226, 0.12)';

  const yScale = (v) => M.top + plotH * (1 - v / 100);
  const xCenter = (i) => M.left + (plotW / GRADES.length) * (i + 0.5);

  function quantile(sorted, q) {
    if (!sorted.length) return null;
    const i = (sorted.length - 1) * q;
    const lo = Math.floor(i), hi = Math.ceil(i);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
  }

  function render(rows) {
    const parts = [];

    // Y-axis: pollution burden percentile (0-100)
    for (let v = 0; v <= 100; v += 20) {
      const y = yScale(v);
      parts.push(
        `<line x1="${M.left}" y1="${y}" x2="${W - M.right}" y2="${y}" ` +
        `stroke="${GRID}" stroke-dasharray="2,4" />`
      );
      parts.push(
        `<text x="${M.left - 10}" y="${y + 4}" text-anchor="end" ` +
        `font-family="JetBrains Mono, monospace" font-size="10" fill="${INK_SOFT}">${v}</text>`
      );
    }
    parts.push(
      `<text transform="translate(20, ${M.top + plotH / 2}) rotate(-90)" ` +
      `text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="12" ` +
      `font-style="italic" fill="${INK_SOFT}">` +
      `pollution burden percentile (statewide)</text>`
    );

    // Per-grade: box + jittered dots.
    GRADES.forEach((g, i) => {
      const subset = rows.filter((r) => r.grade === g);
      const vals = subset.map((r) => r.burdenP).sort((a, b) => a - b);
      const cx = xCenter(i);
      const boxW = plotW / GRADES.length * 0.45;
      const color = GRADE_COLOR[g];

      // Box: p25..p75 with median line; whiskers p10..p90
      if (vals.length) {
        const q10 = quantile(vals, 0.10);
        const q25 = quantile(vals, 0.25);
        const q50 = quantile(vals, 0.50);
        const q75 = quantile(vals, 0.75);
        const q90 = quantile(vals, 0.90);

        // Whiskers
        parts.push(
          `<line x1="${cx}" y1="${yScale(q10)}" x2="${cx}" y2="${yScale(q90)}" ` +
          `stroke="${color}" stroke-width="1" opacity="0.6" />` +
          `<line x1="${cx - 10}" y1="${yScale(q10)}" x2="${cx + 10}" y2="${yScale(q10)}" ` +
          `stroke="${color}" stroke-width="1" opacity="0.6" />` +
          `<line x1="${cx - 10}" y1="${yScale(q90)}" x2="${cx + 10}" y2="${yScale(q90)}" ` +
          `stroke="${color}" stroke-width="1" opacity="0.6" />`
        );

        // Box (p25-p75)
        parts.push(
          `<rect x="${cx - boxW / 2}" y="${yScale(q75)}" ` +
          `width="${boxW}" height="${yScale(q25) - yScale(q75)}" ` +
          `fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1" />`
        );

        // Median line
        parts.push(
          `<line x1="${cx - boxW / 2}" y1="${yScale(q50)}" ` +
          `x2="${cx + boxW / 2}" y2="${yScale(q50)}" ` +
          `stroke="${color}" stroke-width="2.5" />`
        );
      }

      // Jittered dots for each tract
      const jitterRange = boxW * 0.85;
      subset.forEach((r, idx) => {
        // Deterministic jitter: hash by tract id
        const h = (r.tract || idx) % 997;
        const jitter = ((h / 997) - 0.5) * jitterRange;
        const cy = yScale(r.burdenP);
        parts.push(
          `<circle cx="${cx + jitter}" cy="${cy}" r="3.5" ` +
          `fill="${color}" fill-opacity="0.75" stroke="#1a1a1a" stroke-width="0.4">` +
          `<title>Tract ${r.tract} — grade ${r.grade}, burden percentile ${r.burdenP}` +
          (r.pop ? `\nPopulation: ${r.pop.toLocaleString()}` : '') + `</title>` +
          `</circle>`
        );
      });

      // X-axis grade label + n
      parts.push(
        `<text x="${cx}" y="${H - M.bottom + 24}" text-anchor="middle" ` +
        `font-family="Fraunces, Georgia, serif" font-size="20" font-weight="500" fill="${color}">${g}</text>` +
        `<text x="${cx}" y="${H - M.bottom + 42}" text-anchor="middle" ` +
        `font-family="Fraunces, Georgia, serif" font-style="italic" font-size="11" fill="${INK_SOFT}">` +
        `${GRADE_LABEL[g].split('—')[1]?.trim().replace(/"/g,'') || ''} · n=${subset.length}</text>`
      );
    });

    // X-axis baseline
    parts.push(
      `<line x1="${M.left}" y1="${H - M.bottom}" x2="${W - M.right}" y2="${H - M.bottom}" ` +
      `stroke="${INK_SOFT}" stroke-opacity="0.35" stroke-width="1" />`
    );

    svg.innerHTML = parts.join('');
  }

  fetch('data/burden_by_grade.json')
    .then((r) => r.json())
    .then((d) => render(d.tracts || []))
    .catch((e) => console.warn('burden_by_grade.json failed:', e));
})();
