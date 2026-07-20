# Climate Change at a Glance

An open, interactive atlas of **weekly district-level rainfall and temperature
anomalies** for India, built from IMD daily gridded data. SatSure design build.

🌐 **Live dashboard:** https://santa1309.github.io/climate_change_at_glance/

- **Rainfall** — deviation from the 1971–2020 normal (%)
- **Max / Min temperature** — anomaly from the 2016–2024 normal (°C)

Pick a year / month / week, switch the climate layer, and click any district for
its actual vs. normal values and a weekly trajectory chart.

---

## Data sources & methodology

- **Rainfall:** IMD daily gridded rainfall; normal = mean of yearly weekly-sums
  across 1961–2010.
- **Temperature:** IMD daily gridded tmax/tmin; normal = mean of yearly
  weekly-means across 2016–2024.

District-level values are area-weighted zonal means.
