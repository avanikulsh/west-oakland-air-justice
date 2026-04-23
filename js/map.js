// Leaflet map: 1937 HOLC redlining × CalEnviroScreen 4.0 pollution burden ×
// Port of Oakland / truck corridors.
//
// Data:
//   data/redlining.geojson       — Mapping Inequality (Richmond DSL), CAOakland1937
//   data/calenviroscreen.geojson — OEHHA CalEnviroScreen 4.0 tracts (Oakland area)

(function () {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;

  const WEST_OAKLAND = [37.810, -122.295];

  const map = L.map('map', {
    center: WEST_OAKLAND,
    zoom: 13,
    scrollWheelZoom: false,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  // Placeholders set up before fetches resolve, so toggles always work.
  let redliningLayer = L.layerGroup().addTo(map);
  let pollutionLayer = L.layerGroup().addTo(map);

  const portCorridor = L.layerGroup([
    L.marker([37.804, -122.328]).bindPopup(
      '<strong>Port of Oakland</strong><br />Container terminals &amp; truck staging'
    ),
    L.polyline(
      [[37.805, -122.326], [37.808, -122.302], [37.812, -122.280]],
      { color: '#e89b7f', weight: 4, opacity: 0.7, dashArray: '6, 6' }
    ).bindPopup('Primary diesel truck corridor'),
  ]).addTo(map);

  function wireToggle(id, getLayer) {
    const cb = document.getElementById(id);
    if (!cb) return;
    cb.addEventListener('change', () => {
      const layer = getLayer();
      if (!layer) return;
      if (cb.checked) map.addLayer(layer);
      else map.removeLayer(layer);
    });
  }
  wireToggle('toggle-redlining', () => redliningLayer);
  wireToggle('toggle-pollution', () => pollutionLayer);
  wireToggle('toggle-port',      () => portCorridor);

  // ----- HOLC redlining polygons -----
  fetch('data/redlining.geojson')
    .then((r) => r.json())
    .then((gj) => {
      map.removeLayer(redliningLayer);
      redliningLayer = L.geoJSON(gj, {
        style: (f) => {
          const g = f.properties.holc_grade || f.properties.grade;
          const fill = g === 'D' ? '#a33b1e'
                     : g === 'C' ? '#d9a34f'
                     : g === 'B' ? '#7a9f6b'
                     : g === 'A' ? '#4a5c3a'
                     : '#888';
          return { color: fill, weight: 1, fillColor: fill, fillOpacity: 0.45 };
        },
        onEachFeature: (f, layer) => {
          const g = f.properties.holc_grade || f.properties.grade;
          const name = {
            A: '"Best"',
            B: '"Still Desirable"',
            C: '"Declining"',
            D: '"Hazardous"',
          }[g] || '';
          layer.bindPopup(
            `<strong>HOLC Grade ${g}</strong> ${name}<br />1937 Oakland map`
          );
        },
      });
      if (document.getElementById('toggle-redlining').checked) {
        map.addLayer(redliningLayer);
      }
    })
    .catch((e) => console.warn('redlining.geojson failed:', e));

  // ----- CalEnviroScreen 4.0 pollution burden tracts -----
  fetch('data/calenviroscreen.geojson')
    .then((r) => r.json())
    .then((gj) => {
      map.removeLayer(pollutionLayer);
      const colorFor = (p) => {
        const v = p || 0;
        return v > 85 ? '#4b0707'
             : v > 70 ? '#a33b1e'
             : v > 50 ? '#d9a34f'
             : v > 30 ? '#c6c36a'
             :          '#4a5c3a';
      };
      pollutionLayer = L.geoJSON(gj, {
        style: (f) => {
          const p = f.properties.burdenP;
          return {
            color: '#1a1a1a',
            weight: 0.5,
            fillColor: colorFor(p),
            fillOpacity: 0.55,
          };
        },
        onEachFeature: (f, layer) => {
          const p = f.properties;
          layer.bindPopup(
            `<strong>Tract ${p.tract}</strong><br />` +
            `CalEnviroScreen pollution-burden percentile: <strong>${p.burdenP}</strong><br />` +
            `Diesel PM percentile: ${p.dpmP}<br />` +
            `Asthma ED percentile: ${p.asthmaP}<br />` +
            `Population: ${p.pop?.toLocaleString?.() ?? p.pop}`
          );
        },
      });
      if (document.getElementById('toggle-pollution').checked) {
        map.addLayer(pollutionLayer);
      }
    })
    .catch((e) => console.warn('calenviroscreen.geojson failed:', e));
})();
