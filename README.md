# Climate Change at a Glance

An open, interactive atlas of **weekly district-level rainfall and temperature
anomalies** for India, built from IMD daily gridded data. SatSure design build.

🌐 **Live dashboard:** https://santa1309.github.io/climate_change_at_glance/

- **Rainfall** — deviation from the 1961–2010 normal (%)
- **Max / Min temperature** — anomaly from the 2016–2024 normal (°C)

Pick a year / month / week, switch the climate layer, and click any district for
its actual vs. normal values and a weekly trajectory chart.

---

## Repository layout

```
index.html              Root redirect → satsure_dashboard/index.html
satsure_dashboard/      The dashboard (HTML + CSS + JS + logo)
data/                   districts.geojson + rainfall/ + temperature/ (per-week JSON)
.nojekyll               Serve every file as-is on GitHub Pages
```

This is a **static site** — GitHub Pages serves it directly. The dashboard loads
data with relative paths, so the root link above just works.

## Updating the data

This repo is published from the data pipeline in the companion working copy.
Run the one-click updater there:

```
update_satsure.bat
```

It regenerates any newly-completed weeks, syncs the data + dashboard into this
repo, and pushes — after which GitHub Pages serves the new week within a minute
or two.

## Data sources & methodology

- **Rainfall:** IMD daily gridded rainfall; normal = mean of yearly weekly-sums
  across 1961–2010.
- **Temperature:** IMD daily gridded tmax/tmin; normal = mean of yearly
  weekly-means across 2016–2024.

District-level values are area-weighted zonal means.
