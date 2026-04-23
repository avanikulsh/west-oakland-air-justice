// Demographic comparison charts (Chapter 2).
// Numbers come from data/demographics.json — computed from CES 4.0 + ACS 5-Year
// (2015-2019) tracts joined to 1937 HOLC grades.

(function () {
  if (typeof Chart === 'undefined') return;

  // Dark / air-wind defaults
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.color = '#8ea2b8';
  Chart.defaults.borderColor = 'rgba(168, 204, 226, 0.16)';
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.color = '#dde6ef';
  Chart.defaults.plugins.title.color = '#eef4fa';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(10, 18, 30, 0.92)';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(164, 210, 234, 0.3)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.titleColor = '#cfe7f3';
  Chart.defaults.plugins.tooltip.bodyColor  = '#dde6ef';

  const SKY    = '#a4d2ea';
  const HAZE   = '#e2958e';
  const SAGE   = '#9dc6a4';
  const AMBER  = '#d9b77a';
  const VIOLET = '#b8a6d9';

  const GRID = 'rgba(168, 204, 226, 0.10)';

  const gridScale = {
    ticks: { color: '#8ea2b8', font: { family: "'Inter', sans-serif", size: 11 } },
    grid:  { color: GRID, drawTicks: false },
    border:{ color: 'rgba(168, 204, 226, 0.18)' },
  };

  const FALLBACK = {
    race: {
      redlined:    { black: 20.3, latino: 27.3, asian: 18.5, white: 28.3, other: 5.6 },
      nonRedlined: { black: 14.2, latino: 14.2, asian: 13.9, white: 51.7, other: 6.0 },
    },
    income: { redlined: 68653, nonRedlined: 134289 },
    pollutionBurdenPercentile: { redlined: 59.5, nonRedlined: 23.4 },
  };

  function render(d) {
    const labels = ['Redlined (C/D)', 'Non-redlined (A/B)'];

    const raceCtx = document.getElementById('chart-race');
    if (raceCtx) {
      new Chart(raceCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Black',    data: [d.race.redlined.black,  d.race.nonRedlined.black],  backgroundColor: VIOLET },
            { label: 'Latino',   data: [d.race.redlined.latino, d.race.nonRedlined.latino], backgroundColor: AMBER },
            { label: 'Asian',    data: [d.race.redlined.asian,  d.race.nonRedlined.asian],  backgroundColor: HAZE },
            { label: 'White',    data: [d.race.redlined.white,  d.race.nonRedlined.white],  backgroundColor: SKY },
            { label: 'Other',    data: [d.race.redlined.other,  d.race.nonRedlined.other],  backgroundColor: '#5a6a80' },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Racial composition (%) — ACS 2015-2019', font: { size: 13, weight: '600' } },
            legend: { position: 'bottom' },
          },
          scales: {
            x: { ...gridScale, stacked: true },
            y: { ...gridScale, stacked: true, max: 100, ticks: { ...gridScale.ticks, callback: (v) => v + '%' } },
          },
        },
      });
    }

    const incomeCtx = document.getElementById('chart-income');
    if (incomeCtx) {
      new Chart(incomeCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Median household income ($)',
            data: [d.income.redlined, d.income.nonRedlined],
            backgroundColor: [HAZE, SAGE],
            borderRadius: 4,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Median household income — ACS 2015-2019', font: { size: 13, weight: '600' } },
            legend: { display: false },
          },
          scales: {
            x: gridScale,
            y: {
              ...gridScale,
              beginAtZero: true,
              ticks: { ...gridScale.ticks, callback: (v) => '$' + (v / 1000) + 'k' },
            },
          },
        },
      });
    }

    const pollCtx = document.getElementById('chart-pollution');
    if (pollCtx) {
      new Chart(pollCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'CalEnviroScreen pollution burden (percentile)',
            data: [d.pollutionBurdenPercentile.redlined, d.pollutionBurdenPercentile.nonRedlined],
            backgroundColor: [HAZE, SAGE],
            borderRadius: 4,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Pollution burden — CalEnviroScreen 4.0 percentile', font: { size: 13, weight: '600' } },
            legend: { display: false },
          },
          scales: {
            x: gridScale,
            y: { ...gridScale, beginAtZero: true, max: 100, ticks: { ...gridScale.ticks, callback: (v) => v + '%' } },
          },
        },
      });
    }
  }

  fetch('data/demographics.json')
    .then((r) => (r.ok ? r.json() : FALLBACK))
    .catch(() => FALLBACK)
    .then(render);
})();
