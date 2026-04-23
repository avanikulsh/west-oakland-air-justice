// Two lung figures breathing at the same rate, with different fill depths.
// The clean lung fills ~92% of capacity; the burdened lung fills ~58% and lags.

(function () {
  const clean = document.querySelector('.lung--clean .lung__svg');
  const burdened = document.querySelector('.lung--burdened .lung__svg');
  if (!clean || !burdened) return;

  function lungMarkup(opts) {
    const tint = opts.tint;   // base lung color
    const stain = opts.stain; // dark particulate tint
    return `
      <defs>
        <radialGradient id="${opts.id}-grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stop-color="${tint}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${stain}" stop-opacity="0.95"/>
        </radialGradient>
        <clipPath id="${opts.id}-clipL">
          <path d="M95 70 C 70 70, 45 100, 45 160 C 45 210, 65 240, 90 240 L 95 240 Z"/>
        </clipPath>
        <clipPath id="${opts.id}-clipR">
          <path d="M105 70 C 130 70, 155 100, 155 160 C 155 210, 135 240, 110 240 L 105 240 Z"/>
        </clipPath>
      </defs>

      <!-- Trachea -->
      <path d="M100 30 L 100 75" stroke="rgba(168,204,226,0.55)" stroke-width="6" stroke-linecap="round" fill="none"/>
      <circle cx="100" cy="28" r="6" fill="rgba(168,204,226,0.55)"/>

      <!-- Lung outlines -->
      <path d="M95 70 C 70 70, 45 100, 45 160 C 45 210, 65 240, 90 240 L 95 240 Z"
            fill="rgba(20,30,44,0.55)" stroke="rgba(168,204,226,0.45)" stroke-width="1.2"/>
      <path d="M105 70 C 130 70, 155 100, 155 160 C 155 210, 135 240, 110 240 L 105 240 Z"
            fill="rgba(20,30,44,0.55)" stroke="rgba(168,204,226,0.45)" stroke-width="1.2"/>

      <!-- Breath fill -->
      <rect id="${opts.id}-fillL" x="45" y="240" width="55" height="0"
            fill="url(#${opts.id}-grad)" clip-path="url(#${opts.id}-clipL)"/>
      <rect id="${opts.id}-fillR" x="105" y="240" width="55" height="0"
            fill="url(#${opts.id}-grad)" clip-path="url(#${opts.id}-clipR)"/>

      <!-- Optional particulate specks for burdened lung -->
      ${opts.specks ? opts.specks : ''}
    `;
  }

  // Particulate specks for the burdened lung.
  let specks = '';
  for (let i = 0; i < 24; i++) {
    const side = Math.random() < 0.5 ? 'L' : 'R';
    const x = side === 'L'
      ? 55 + Math.random() * 40
      : 115 + Math.random() * 35;
    const y = 90 + Math.random() * 140;
    const r = 0.8 + Math.random() * 1.4;
    specks += `<circle cx="${x}" cy="${y}" r="${r}" fill="#1a1a1a" opacity="${0.55 + Math.random() * 0.3}"/>`;
  }

  clean.innerHTML = lungMarkup({
    id: 'clean',
    tint: '#cfe7f3',   // breath-white sky
    stain: '#9dc6a4',  // sage
  });

  burdened.innerHTML = lungMarkup({
    id: 'burdened',
    tint: '#a45a54',   // deep haze
    stain: '#1a1014',  // soot
    specks,
  });

  // Animate: both breathe at the same period (4s), but different peak fills
  // and the burdened lung lags slightly on exhale.
  const PERIOD = 4000;
  const CLEAN_PEAK = 0.92;
  const BURDENED_PEAK = 0.58;
  const BURDENED_LAG = 0.15;

  const fills = {
    cleanL:    document.getElementById('clean-fillL'),
    cleanR:    document.getElementById('clean-fillR'),
    burdenedL: document.getElementById('burdened-fillL'),
    burdenedR: document.getElementById('burdened-fillR'),
  };

  function setFill(rect, depth /* 0..1 */) {
    if (!rect) return;
    const maxHeight = 170; // 240 - 70
    const h = maxHeight * depth;
    rect.setAttribute('height', h);
    rect.setAttribute('y', 240 - h);
  }

  let t0 = performance.now();
  function tick(now) {
    const t = ((now - t0) % PERIOD) / PERIOD;
    const clean = (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0..1
    const burdT = ((now - t0 - PERIOD * BURDENED_LAG) % PERIOD) / PERIOD;
    const burd = (Math.sin(burdT * Math.PI * 2 - Math.PI / 2) + 1) / 2;

    setFill(fills.cleanL, clean * CLEAN_PEAK);
    setFill(fills.cleanR, clean * CLEAN_PEAK);
    setFill(fills.burdenedL, burd * BURDENED_PEAK);
    setFill(fills.burdenedR, burd * BURDENED_PEAK);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
