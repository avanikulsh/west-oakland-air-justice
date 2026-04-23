
| File | Source | Shape |
|---|---|---|
| `redlining.geojson` | [Mapping Inequality (Richmond DSL)](https://dsl.richmond.edu/panorama/redlining/data/CA-Oakland), 1937 Oakland HOLC residential-security map | 120 polygons. Properties: `holc_grade` (A/B/C/D), `label`, `area_id` |
| `calenviroscreen.geojson` | [OEHHA CalEnviroScreen 4.0](https://oehha.ca.gov/calenviroscreen/report/calenviroscreen-40) tracts for Oakland + environs | 124 tract polygons. Properties: `tract`, `pop`, `burdenP`, `dpm`, `dpmP`, `asthma_rate`, `asthmaP`, race %s, `poverty_pct` |
| `demographics.json` | CES 4.0 × [ACS 5-Year 2015-2019](https://api.census.gov/data/2019/acs/acs5) (B19013) × Mapping Inequality, joined by tract centroid | Comparison of redlined (HOLC C/D) vs. non-redlined (HOLC A/B) Oakland tracts, population-weighted |
| `asthma.json` | [CDPH / HCAI Asthma ED Visit Rates by ZIP, 2013-2023](https://data.chhs.ca.gov/dataset/asthma-emergency-department-visit-rates) | `{_meta, series: [{label, rate, visits}]}`; West Oakland = mean of ZIP 94607 + 94608 |



1. **HOLC polygons.** Download `https://dsl.richmond.edu/panorama/redlining/static/citiesData/CAOakland1937/geojson.json`. Strip unused props, keep `grade` (renamed to `holc_grade`), `label`, `area_id`.
2. **CalEnviroScreen 4.0 tracts.** Query the OEHHA ArcGIS FeatureServer for all Alameda County tracts (`tract > 6001000000 AND tract < 6002000000`), export as GeoJSON. Filter to tracts whose centroid falls within the Oakland + Piedmont bounding box.
3. **Spatial join.** For each CES tract, classify by the HOLC grade containing its centroid. Redlined = C/D, non-redlined = A/B. Compute population-weighted means of race %s, pollution-burden percentile, diesel PM, asthma ED visit rate, and poverty rate.
4. **ACS median income.** Pull `B19013_001E` from the Census API for all Alameda tracts; join on tract FIPS; take population-weighted mean per bucket.
5. **Asthma timeline.** Download the CDPH ZIP-level `.xls`, filter to ZIP 94607 + 94608, average the two rates per year. Note the ICD-9 → ICD-10 coding change on 2015-10-01 — rates before and after are not directly comparable.

## Caveats

- `dpm` / `dpmP` from CES 4.0 are **emissions** (kg/day at the receptor block,
  averaged to the tract), **not** ambient concentration in µg/m³. The site's
  copy reflects this — it does not claim concentration.
- The CES 4.0 "diesel PM" indicator uses CARB 2016 emissions; race/poverty come
  from ACS 2015-2019. So the snapshot here is ~2019-vintage.
- Census tract boundaries are 2010. Mapping Inequality's 1937 polygons
  obviously don't align perfectly to them; centroid-containment is a common
  first-pass method but will misclassify a tract that straddles multiple HOLC
  grades (29 Oakland-area tracts didn't fall inside any HOLC polygon and were
  dropped from the comparison).
