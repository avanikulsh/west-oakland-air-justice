// The "Breathing Timeline" — asthma ED visits per 10k rendered as a breath curve.
// Each data point is a control point; the curve subtly inhales/exhales on a 4s loop
// (peaks grow taller, valleys fall deeper).

(function () {
  const svg = document.getElementById('breathing-svg');
  const labels = document.getElementById('breathing-labels');
  if (!svg) return;

  // Minimal fallback if asthma.json fails to load. The real data lives in
  // data/asthma.json and is sourced from CDPH / HCAI.
  const FALLBACK = [
    { label: '2013', rate: 134 },
    { label: '2019', rate: 88 },
    { label: '2023', rate: 52 },
  ];

  const W = 1200;
  const H = 300;
  const PAD = 40;

  function render(data) {
    const max = Math.max(...data.map((d) => d.rate));
    const stepX = (W - PAD * 2) / (data.length - 1);

    // Points at rest (midline amplitude).
    const pts = data.map((d, i) => {
      const x = PAD + i * stepX;
      const base = H / 2;
      const amp = ((d.rate / max) * (H / 2 - PAD));
      return { x, yUp: base - amp, yDown: base + amp, amp };
    });

    // Baseline midline.
    svg.innerHTML = `
      <defs>
        <linearGradient id="breathGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stop-color="#e2958e" stop-opacity="0.85"/>
          <stop offset="50%" stop-color="#a4d2ea" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#9dc6a4" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <line x1="${PAD}" y1="${H/2}" x2="${W-PAD}" y2="${H/2}"
            stroke="rgba(168,204,226,0.25)" stroke-dasharray="2,4" />
      <path id="breath-top"    fill="url(#breathGrad)" opacity="0.9" />
      <path id="breath-bottom" fill="url(#breathGrad)" opacity="0.55" />
      ${pts.map((p) => `
        <circle cx="${p.x}" cy="${p.yUp}"   r="3" fill="#cfe7f3" />
        <circle cx="${p.x}" cy="${p.yDown}" r="3" fill="#cfe7f3" opacity="0.5"/>
        <text x="${p.x}" y="${p.yUp - 10}" text-anchor="middle"
              font-family="Fraunces, Georgia, serif" font-style="italic" font-size="12" fill="rgba(221,230,239,0.85)">
          ${data[pts.indexOf(p)].rate}
        </text>
      `).join('')}
    `;

    const top = svg.querySelector('#breath-top');
    const bottom = svg.querySelector('#breath-bottom');

    // X-axis labels below the SVG.
    labels.innerHTML = data.map((d) => `<span>${d.label ?? d.decade ?? ''}</span>`).join('');

    // Smooth cubic-bezier path through points, mirrored for top/bottom.
    function smoothPath(points, key) {
      let d = `M ${PAD} ${H/2} `;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) {
          d += `L ${p.x} ${p[key]} `;
        } else {
          const prev = points[i - 1];
          const cx = (prev.x + p.x) / 2;
          d += `C ${cx} ${prev[key]}, ${cx} ${p[key]}, ${p.x} ${p[key]} `;
        }
      }
      d += `L ${W - PAD} ${H/2} Z`;
      return d;
    }

    // Breath cycle: modulate amplitude on a sine wave.
    let t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / 1000;
      const breath = 0.75 + 0.25 * Math.sin(t * (Math.PI / 2)); // ~4s cycle
      const animated = pts.map((p) => ({
        x: p.x,
        yUp:   H / 2 - p.amp * breath,
        yDown: H / 2 + p.amp * breath,
      }));
      top.setAttribute('d', smoothPath(animated, 'yUp'));
      bottom.setAttribute('d', smoothPath(animated, 'yDown'));
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  fetch('data/asthma.json')
    .then((r) => (r.ok ? r.json() : FALLBACK))
    .catch(() => FALLBACK)
    .then((d) => render(Array.isArray(d) ? d : (d.series || FALLBACK)));
})();
