/* ============================================================
   SatSure Climate Anomaly Atlas — Frontend logic
   Layers: rainfall · tmax · tmin   ·   data in ../data/
   ============================================================ */

(() => {
  "use strict";

  // ===========================================================
  // VARIABLE CONFIG
  // ===========================================================

  // Category colors kept identical to the original Anomaly Atlas legend.
  const RAINFALL_CATS = [
    { key: "Excess",    color: "#60b1f4", range: ">+20%"        },
    { key: "Normal",    color: "#6ae944", range: "-19% to +20%" },
    { key: "Deficient", color: "#dd7534", range: "-20% to -59%" },
    { key: "Scanty",    color: "#ffe23a", range: "-60% to -99%" },
    { key: "No Rain",   color: "#969696", range: "≤ -99%"       },
    { key: "No Data",   color: "#E9EDF0", range: "—"            },
  ];

  const TEMP_CATS = [
    { key: "< -5",     color: "#004da8", range: "< -5 °C"     },
    { key: "-5 to -4", color: "#0536fe", range: "-5 to -4 °C" },
    { key: "-4 to -3", color: "#618cd3", range: "-4 to -3 °C" },
    { key: "-3 to -2", color: "#0a8500", range: "-3 to -2 °C" },
    { key: "-2 to -1", color: "#17dd05", range: "-2 to -1 °C" },
    { key: "-1 to 0",  color: "#b8edae", range: "-1 to 0 °C"  },
    { key: "0 to 1",   color: "#f6f69c", range: "0 to +1 °C"  },
    { key: "1 to 2",   color: "#f9f904", range: "+1 to +2 °C" },
    { key: "2 to 3",   color: "#f7ad00", range: "+2 to +3 °C" },
    { key: "3 to 4",   color: "#ff9b9b", range: "+3 to +4 °C" },
    { key: "4 to 5",   color: "#ff0000", range: "+4 to +5 °C" },
    { key: "> 5",      color: "#600700", range: "> +5 °C"     },
    { key: "No Data",  color: "#E9EDF0", range: "—"           },
  ];

  const TEMP_SURPLUS = new Set(["0 to 1", "1 to 2", "2 to 3", "3 to 4", "4 to 5", "> 5"]);
  const TEMP_DEFICIT = new Set(["< -5", "-5 to -4", "-4 to -3", "-3 to -2", "-2 to -1", "-1 to 0"]);

  const VARIABLES = {
    rainfall: {
      id: "rainfall", label: "Rainfall deviation",
      dataBase: "../data/rainfall", categories: RAINFALL_CATS,
      fields: { actual: "actual", normal: "normal", measure: "deviation", category: "category" },
      units: { actual: "mm", normal: "mm", measure: "%" },
      measureLabel: "Deviation",
      formatMeasure: v => (v == null ? "—" : (v > 0 ? "+" : "") + Number(v).toFixed(1) + "%"),
      formatActual: v => v == null ? "—" : Number(v).toFixed(1) + " mm",
      formatNormal: v => v == null ? "—" : Number(v).toFixed(1) + " mm",
      surplusKeys: new Set(["Excess"]),
      deficitKeys: new Set(["Deficient", "Scanty", "No Rain"]),
      hero: { surplusLabel: "Surplus", surplusUnit: "excess districts",
              deficitLabel: "Deficit", deficitUnit: "deficient + scanty + no-rain" },
      surplusColor: "#60b1f4", deficitColor: "#dd7534",
      legendTitle: "Rainfall departure classes",
      normalNote: "Normal rainfall considered from 1961–2010",
      yAxisUnit: "mm",
      info: "District-level deviation of weekly rainfall from the 1961–2010 normal, area-weighted from IMD daily gridded rainfall.",
    },
    tmax: {
      id: "tmax", label: "Max-temperature anomaly",
      dataBase: "../data/temperature", categories: TEMP_CATS,
      fields: { actual: "tmax_actual", normal: "tmax_normal", measure: "tmax_anomaly", category: "tmax_category" },
      units: { actual: "°C", normal: "°C", measure: "°C" },
      measureLabel: "Anomaly",
      formatMeasure: v => (v == null ? "—" : (v > 0 ? "+" : "") + Number(v).toFixed(2) + "°C"),
      formatActual: v => v == null ? "—" : Number(v).toFixed(1) + " °C",
      formatNormal: v => v == null ? "—" : Number(v).toFixed(1) + " °C",
      surplusKeys: TEMP_SURPLUS, deficitKeys: TEMP_DEFICIT,
      hero: { surplusLabel: "Warmer", surplusUnit: "districts above normal",
              deficitLabel: "Cooler", deficitUnit: "districts below normal" },
      surplusColor: "#ff0000", deficitColor: "#0536fe",
      legendTitle: "Max-temp anomaly classes",
      normalNote: "Max-temp anomaly w.r.t average of 2016–2024",
      yAxisUnit: "°C",
      info: "District-level anomaly of weekly mean daily maximum temperature vs the 2016–2024 normal.",
    },
    tmin: {
      id: "tmin", label: "Min-temperature anomaly",
      dataBase: "../data/temperature", categories: TEMP_CATS,
      fields: { actual: "tmin_actual", normal: "tmin_normal", measure: "tmin_anomaly", category: "tmin_category" },
      units: { actual: "°C", normal: "°C", measure: "°C" },
      measureLabel: "Anomaly",
      formatMeasure: v => (v == null ? "—" : (v > 0 ? "+" : "") + Number(v).toFixed(2) + "°C"),
      formatActual: v => v == null ? "—" : Number(v).toFixed(1) + " °C",
      formatNormal: v => v == null ? "—" : Number(v).toFixed(1) + " °C",
      surplusKeys: TEMP_SURPLUS, deficitKeys: TEMP_DEFICIT,
      hero: { surplusLabel: "Warmer", surplusUnit: "districts above normal",
              deficitLabel: "Cooler", deficitUnit: "districts below normal" },
      surplusColor: "#ff0000", deficitColor: "#0536fe",
      legendTitle: "Min-temp anomaly classes",
      normalNote: "Min-temp anomaly w.r.t average of 2016–2024",
      yAxisUnit: "°C",
      info: "District-level anomaly of weekly mean daily minimum temperature vs the 2016–2024 normal.",
    },
  };

  const VAR_ORDER = ["rainfall", "tmax", "tmin"];
  const FILL_OPACITY = 0.82;

  const DISTRICT_KEY = "dtname";
  const STATE_KEY    = "stname";
  const SEP = "␟"; // composite key separator (name ␟ state)

  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const IMPORTANT_DISTRICTS_LC = new Set([
    "bangalore urban", "bengaluru urban", "bengaluru",
    "mumbai city", "mumbai suburban", "mumbai",
    "chennai", "kolkata", "hyderabad",
    "lucknow", "jaipur", "bhopal", "patna",
    "thiruvananthapuram", "tiruvananthapuram",
    "ahmedabad", "pune", "surat", "kanpur nagar", "kanpur",
    "nagpur", "indore", "vadodara", "visakhapatnam", "coimbatore",
    "agra", "varanasi", "meerut", "ludhiana", "amritsar",
    "faridabad", "gurgaon", "gurugram", "ranchi", "raipur",
    "bhubaneswar", "khordha", "khurda", "cuttack",
    "dehradun", "srinagar", "shimla", "gandhinagar",
    "imphal", "imphal west", "aizawl", "kohima",
    "itanagar", "papum pare", "gangtok", "east sikkim",
    "shillong", "east khasi hills", "agartala", "west tripura",
    "panaji", "north goa", "kamrup metropolitan", "jammu", "chandigarh",
    "new delhi", "central delhi", "south delhi", "north delhi",
    "east delhi", "west delhi", "north east delhi", "south west delhi",
    "rajkot", "nashik", "aurangabad", "madurai", "mysuru", "mysore",
    "tiruchirappalli", "salem", "vellore",
    "mangaluru", "mangalore", "thane", "kolhapur",
    "puducherry", "pondicherry",
  ]);

  // ===========================================================
  // STATE
  // ===========================================================

  const state = {
    currentVar: "rainfall",
    sources: {},
    currentWeekKey: null,
    currentWeekData: null,
    selectedDistrict: null,
    selectedState: null,
    selectedLayer: null,
    districtStates: new Map(),     // name -> [stateName, ...]
    stateToDistricts: {},          // stateName -> [name, ...]
    allDistricts: [],              // [{name, state}] sorted by name
    districtLayer: new Map(),      // "name␟state" -> layer
    layersByName: new Map(),       // name -> [{state, layer}]
    geojsonLayer: null,
    map: null,
    trendChart: null,
    pieChart: null,
    districtLabels: new Map(),     // "name␟state" -> info
    selectedLabel: null,
    labelFrame: null,
  };

  function v() { return VARIABLES[state.currentVar]; }
  function src() { return state.sources[v().dataBase]; }
  const LK = (name, st) => `${name}${SEP}${st}`;

  // ===========================================================
  // Helpers
  // ===========================================================

  const $ = sel => document.querySelector(sel);

  const fmtDate = iso => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  function titleCase(s) {
    return String(s).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  function contrastText(hex) {
    const m = hex.replace("#", "");
    const r = parseInt(m.slice(0,2),16), g = parseInt(m.slice(2,4),16), b = parseInt(m.slice(4,6),16);
    return (0.2126*r + 0.7152*g + 0.0722*b) / 255 > 0.6 ? "#212B36" : "#ffffff";
  }

  function hexToRgba(hex, alpha) {
    const m = hex.replace("#", "");
    return `rgba(${parseInt(m.slice(0,2),16)},${parseInt(m.slice(2,4),16)},${parseInt(m.slice(4,6),16)},${alpha})`;
  }

  async function fetchJSON(path) {
    if (typeof EMBEDDED_DATA !== "undefined") {
      if (path.includes("districts.geojson")) return EMBEDDED_DATA.districtsGeojson;
      if (path.includes("rainfall/manifest.json")) return EMBEDDED_DATA.rainfall.manifest;
      if (path.includes("temperature/manifest.json")) return EMBEDDED_DATA.temperature.manifest;
      if (path.includes("rainfall/timeseries.json")) return EMBEDDED_DATA.rainfall.timeseries;
      if (path.includes("temperature/timeseries.json")) return EMBEDDED_DATA.temperature.timeseries;
      const rw = path.match(/rainfall\/weeks\/(.+)\.json/);
      if (rw) return EMBEDDED_DATA.rainfall.weeks[rw[1]];
      const tw = path.match(/temperature\/weeks\/(.+)\.json/);
      if (tw) return EMBEDDED_DATA.temperature.weeks[tw[1]];
    }
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return res.json();
  }

  // ===========================================================
  // BOOT
  // ===========================================================

  async function init() {
    try {
      await loadSource(v().dataBase);
      const m = src().manifest;
      if (!m.weeks?.length) throw new Error("Manifest has no weeks. Run the pipeline first.");

      buildLayerPanel();
      buildLegend();
      populateTimeSelectors();

      const latest = m.weeks[m.weeks.length - 1];
      setTimeSelectorValues(latest);
      $("#metaCurrentWeek").textContent =
        `${MONTH_NAMES[latest.month-1].slice(0,3)} ${latest.year} · W${latest.week}`;

      initMap();
      applyVariableLabels();
      wireChrome();

      const districts = await fetchJSON(`../data/districts.geojson`);
      buildLocationIndex(districts);
      populateLocationSelectors();
      renderDistricts(districts);

      await loadWeek(latest.key);
      applyWeekToMap();
      updateSummary();
      updateHeroStats();
      updateDateRange();

      hideLoading();
    } catch (err) {
      console.error(err);
      $(".loader-text").textContent = "Failed to load: " + err.message;
    }
  }

  // ===========================================================
  // Sources
  // ===========================================================

  async function loadSource(base) {
    if (state.sources[base]?.manifest) return state.sources[base];
    const manifest = await fetchJSON(`${base}/manifest.json`);
    state.sources[base] = {
      manifest,
      weeksByKey: new Map(manifest.weeks.map(w => [w.key, w])),
      weekCache: new Map(),
      timeseries: null,
      timeseriesPromise: null,
    };
    return state.sources[base];
  }

  async function loadWeek(key) {
    const s = src();
    if (s.weekCache.has(key)) {
      state.currentWeekKey = key;
      state.currentWeekData = s.weekCache.get(key);
      return state.currentWeekData;
    }
    const data = await fetchJSON(`${v().dataBase}/weeks/${key}.json`);
    s.weekCache.set(key, data);
    state.currentWeekKey = key;
    state.currentWeekData = data;
    return data;
  }

  function getTimeseries() {
    const s = src();
    if (s.timeseries) return Promise.resolve(s.timeseries);
    if (s.timeseriesPromise) return s.timeseriesPromise;
    s.timeseriesPromise = fetchJSON(`${v().dataBase}/timeseries.json`).then(ts => { s.timeseries = ts; return ts; });
    return s.timeseriesPromise;
  }

  // ===========================================================
  // LAYER PANEL  (Section → Layer · Info · Visibility)
  // ===========================================================

  function buildLayerPanel() {
    const list = $("#layerList");
    list.innerHTML = VAR_ORDER.map(id => {
      const V = VARIABLES[id];
      const active = id === state.currentVar;
      return `
      <div class="layer-row ${active ? "is-active" : ""}" data-var="${id}" title="Show this layer">
        <span class="layer-swatch" style="background:${V.surplusColor}"></span>
        <span class="layer-name">${escapeHTML(V.label)}</span>
        <span class="layer-ctrls">
          <button class="layer-ic layer-info" title="${escapeHTML(V.info)}" aria-label="Layer info">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
          </button>
          <button class="layer-ic layer-vis" title="Show this layer" aria-label="Show layer" aria-pressed="${active}">
            ${active ? eyeOpen() : eyeClosed()}
          </button>
        </span>
      </div>`;
    }).join("");

    const secToggle = $("#layerSectionToggle");
    secToggle.addEventListener("click", () => {
      const open = secToggle.getAttribute("aria-expanded") === "true";
      secToggle.setAttribute("aria-expanded", String(!open));
      $("#layerList").classList.toggle("is-collapsed", open);
    });

    list.querySelectorAll(".layer-row").forEach(row => {
      const id = row.dataset.var;
      row.addEventListener("click", e => {
        if (e.target.closest(".layer-info")) return; // info button: tooltip only
        switchVariable(id);
      });
    });
  }

  function eyeOpen() {
    return `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
  function eyeClosed() {
    return `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-7-11-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  }

  function refreshLayerPanelActive() {
    $("#layerList").querySelectorAll(".layer-row").forEach(row => {
      const active = row.dataset.var === state.currentVar;
      row.classList.toggle("is-active", active);
      const vis = row.querySelector(".layer-vis");
      vis.innerHTML = active ? eyeOpen() : eyeClosed();
      vis.setAttribute("aria-pressed", String(active));
      vis.title = active ? "Active layer" : "Show this layer";
    });
    $("#activeLayerChip").textContent = v().label;
  }

  // ===========================================================
  // Variable switching
  // ===========================================================

  async function switchVariable(newVarId) {
    if (!VARIABLES[newVarId] || newVarId === state.currentVar) return;
    const previousKey = state.currentWeekKey;
    state.currentVar = newVarId;
    refreshLayerPanelActive();

    try {
      await loadSource(v().dataBase);
      applyVariableLabels();
      populateTimeSelectors();
      buildLegend();

      const m = src().manifest;
      const target = src().weeksByKey?.has?.(previousKey)
        ? src().weeksByKey.get(previousKey)
        : (m.weeks.find(w => w.key === previousKey) || m.weeks[m.weeks.length - 1]);
      setTimeSelectorValues(target);

      await loadWeek(target.key);
      applyWeekToMap();
      updateSummary();
      updateHeroStats();
      updateDateRange();

      if (state.selectedDistrict) {
        updateDetail(state.selectedDistrict, state.selectedState);
        let series = [];
        try { series = (await getTimeseries())[state.selectedDistrict] || []; }
        catch (e) { console.error("timeseries fetch failed for", v().id, e); }
        drawTrendChart(state.selectedDistrict, series);
      }
    } catch (err) {
      console.error("Variable switch failed:", err);
    }
  }

  // ===========================================================
  // Variable-driven labels
  // ===========================================================

  function applyVariableLabels() {
    const V = v();
    $("#heroSurplusLabel").textContent = V.hero.surplusLabel;
    $("#heroSurplusUnit").textContent  = V.hero.surplusUnit;
    $("#heroDeficitLabel").textContent = V.hero.deficitLabel;
    $("#heroDeficitUnit").textContent  = V.hero.deficitUnit;

    $("#hintSurplusDot").style.background = V.surplusColor;
    $("#hintDeficitDot").style.background = V.deficitColor;
    $("#hintSurplusLbl").textContent = V.hero.surplusLabel;
    $("#hintDeficitLbl").textContent = V.hero.deficitLabel;

    $("#metActualUnit").textContent  = V.units.actual;
    $("#metNormalUnit").textContent  = V.units.normal;
    $("#metMeasureLabel").textContent = V.measureLabel;
    $("#metMeasureUnit").textContent = V.units.measure;

    $("#legendTitle").textContent = V.legendTitle;
    const noteEl = $("#normalNote");
    if (noteEl) noteEl.textContent = V.normalNote || "";
    $("#activeLayerChip").textContent = V.label;
  }

  // ===========================================================
  // Location index / selectors  (state-aware for duplicate names)
  // ===========================================================

  function buildLocationIndex(geojson) {
    state.districtStates = new Map();
    state.stateToDistricts = {};
    state.allDistricts = [];
    geojson.features.forEach(f => {
      const dt = f.properties[DISTRICT_KEY];
      const st = f.properties[STATE_KEY] || "—";
      if (!state.districtStates.has(dt)) state.districtStates.set(dt, []);
      if (!state.districtStates.get(dt).includes(st)) state.districtStates.get(dt).push(st);
      (state.stateToDistricts[st] ||= []).push(dt);
      state.allDistricts.push({ name: dt, state: st });
    });
    Object.keys(state.stateToDistricts).forEach(st =>
      state.stateToDistricts[st].sort((a, b) => a.localeCompare(b)));
    state.allDistricts.sort((a, b) => a.name.localeCompare(b.name) || a.state.localeCompare(b.state));
  }

  function stateOf(name) {
    return state.districtStates.get(name) || [];
  }

  // ---- Time selectors ----
  function populateTimeSelectors() {
    const m = src().manifest;
    const years = [...new Set(m.weeks.map(w => w.year))].sort((a,b)=>a-b);
    const yearSel = $("#yearSelect");
    const prev = Number(yearSel.value);
    yearSel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join("");
    if (years.includes(prev)) yearSel.value = String(prev);

    if (!yearSel._wired) {
      yearSel.addEventListener("change", () => onTimeChange("year"));
      $("#monthSelect").addEventListener("change", () => onTimeChange("month"));
      $("#weekSelect").addEventListener("change", () => onTimeChange("week"));
      yearSel._wired = true;
    }
    refreshMonthOptions();
    refreshWeekOptions();
  }

  function refreshMonthOptions() {
    const year = Number($("#yearSelect").value);
    const months = [...new Set(src().manifest.weeks.filter(w => w.year === year).map(w => w.month))].sort((a,b)=>a-b);
    const sel = $("#monthSelect");
    const prev = Number(sel.value);
    sel.innerHTML = months.map(m => `<option value="${m}">${MONTH_NAMES[m-1]}</option>`).join("");
    if (months.includes(prev)) sel.value = String(prev);
  }

  function refreshWeekOptions() {
    const year = Number($("#yearSelect").value);
    const month = Number($("#monthSelect").value);
    const weeks = src().manifest.weeks.filter(w => w.year === year && w.month === month).map(w => w.week).sort((a,b)=>a-b);
    const sel = $("#weekSelect");
    const prev = Number(sel.value);
    sel.innerHTML = weeks.map(w => `<option value="${w}">Week ${w}</option>`).join("");
    if (weeks.includes(prev)) sel.value = String(prev);
  }

  function setTimeSelectorValues({ year, month, week }) {
    $("#yearSelect").value = String(year);
    refreshMonthOptions();
    $("#monthSelect").value = String(month);
    refreshWeekOptions();
    $("#weekSelect").value = String(week);
  }

  function currentSelectionKey() {
    return `${String($("#yearSelect").value).padStart(4,"0")}-`
         + `${String($("#monthSelect").value).padStart(2,"0")}-`
         + `W${$("#weekSelect").value}`;
  }

  async function onTimeChange(which) {
    if (which === "year") refreshMonthOptions();
    if (which !== "week") refreshWeekOptions();

    let key = currentSelectionKey();
    if (!src().weeksByKey.has(key)) {
      const m = src().manifest;
      const year = Number($("#yearSelect").value);
      const month = Number($("#monthSelect").value);
      const fallback = m.weeks.filter(w => w.year === year && w.month === month)[0]
        || m.weeks.filter(w => w.year === year)[0]
        || m.weeks[m.weeks.length - 1];
      setTimeSelectorValues(fallback);
      key = currentSelectionKey();
    }

    try {
      await loadWeek(key);
      applyWeekToMap();
      updateSummary();
      updateHeroStats();
      updateDateRange();
      if (state.selectedDistrict) {
        updateDetail(state.selectedDistrict, state.selectedState);
        getTimeseries().then(ts => drawTrendChart(state.selectedDistrict, ts[state.selectedDistrict] || []));
      }
    } catch (err) { console.error("Failed to switch week:", err); }
  }

  function updateDateRange() {
    const entry = src().weeksByKey.get(state.currentWeekKey);
    if (!entry) return;
    $("#dateRangeValue").textContent = `${fmtDate(entry.start)} → ${fmtDate(entry.end)}`;
  }

  // ---- Location selectors ----
  function populateLocationSelectors() {
    const states = Object.keys(state.stateToDistricts).sort((a,b)=>a.localeCompare(b));
    $("#stateSelect").innerHTML =
      `<option value="">All states</option>` +
      states.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(titleCase(s))}</option>`).join("");
    $("#stateSelect").addEventListener("change", () => refreshDistrictOptions());
    $("#districtSelect").addEventListener("change", () => {
      const val = $("#districtSelect").value;
      if (!val) return;
      const [name, st] = val.split(SEP);
      selectDistrict(name, st, { fromSelector: true });
    });
    refreshDistrictOptions();
  }

  function refreshDistrictOptions() {
    const st = $("#stateSelect").value;
    let opts;
    if (st && state.stateToDistricts[st]) {
      // single state → names unique within it
      opts = state.stateToDistricts[st].map(name =>
        `<option value="${escapeHTML(LK(name, st))}">${escapeHTML(name)}</option>`);
    } else {
      // all states → suffix the state for duplicate names so they stay distinct
      opts = state.allDistricts.map(({ name, state: s }) => {
        const dup = stateOf(name).length > 1;
        const label = dup ? `${name} — ${titleCase(s)}` : name;
        return `<option value="${escapeHTML(LK(name, s))}">${escapeHTML(label)}</option>`;
      });
    }
    $("#districtSelect").innerHTML = `<option value="">Select district</option>` + opts.join("");
  }

  function syncLocationSelectorsTo(name, stName) {
    if (stName && $("#stateSelect").value !== stName) {
      $("#stateSelect").value = stName;
      refreshDistrictOptions();
    }
    $("#districtSelect").value = LK(name, stName);
  }

  // ===========================================================
  // Map
  // ===========================================================

  function initMap() {
    state.map = L.map("map", {
      zoomControl: true, attributionControl: true,
      minZoom: 4, maxZoom: 12, preferCanvas: true,
    }).setView([22.0, 80.5], 5);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { attribution: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd", maxZoom: 19 }
    ).addTo(state.map);

    state.map.createPane("labels");
    state.map.getPane("labels").style.zIndex = 450;
    state.map.getPane("labels").style.pointerEvents = "none";
    state.map.on("zoomend moveend", scheduleLabelRefresh);
  }

  function catColor(catKey) {
    const cats = v().categories;
    const found = cats.find(c => c.key === catKey);
    return found ? found.color : cats[cats.length - 1].color;
  }

  function renderDistricts(geojson) {
    state.geojsonLayer = L.geoJSON(geojson, {
      style: () => ({ color: "rgba(33,43,54,0.25)", weight: 0.3, fillColor: catColor("No Data"), fillOpacity: FILL_OPACITY }),
      onEachFeature: (feature, layer) => {
        const name = feature.properties[DISTRICT_KEY];
        const st = feature.properties[STATE_KEY] || "—";
        state.districtLayer.set(LK(name, st), layer);
        if (!state.layersByName.has(name)) state.layersByName.set(name, []);
        state.layersByName.get(name).push({ state: st, layer });
        layer.on({
          mouseover: e => {
            if (layer === state.selectedLayer) return;
            e.target.setStyle({ weight: 1.4, color: "#0BAFAF" });
            e.target.bringToFront();
            showTooltip(layer, name, st);
          },
          mouseout: e => {
            if (layer === state.selectedLayer) return;
            e.target.setStyle({ weight: 0.3, color: "rgba(33,43,54,0.25)" });
            layer.closeTooltip();
          },
          click: () => selectDistrict(name, st, { fromMap: true }),
        });
      },
    }).addTo(state.map);

    state.map.fitBounds(state.geojsonLayer.getBounds(), { padding: [10, 10] });
    buildLabelMarkers();
    refreshLabels();
  }

  function applyWeekToMap() {
    if (!state.geojsonLayer || !state.currentWeekData) return;
    const districts = state.currentWeekData.districts;
    const catField = v().fields.category;
    state.geojsonLayer.eachLayer(layer => {
      const name = layer.feature.properties[DISTRICT_KEY];
      const rec = districts[name];
      const cat = rec ? rec[catField] : "No Data";
      layer.setStyle({ fillColor: catColor(cat || "No Data"), fillOpacity: FILL_OPACITY });
    });
  }

  function showTooltip(layer, name, stName) {
    const V = v();
    const rec = state.currentWeekData?.districts?.[name];
    const cat = (rec ? rec[V.fields.category] : "No Data") || "No Data";
    const a = rec ? rec[V.fields.actual] : null;
    const n = rec ? rec[V.fields.normal] : null;
    const d = rec ? rec[V.fields.measure] : null;
    const col = catColor(cat);
    const html = `
      <div class="tip-title-row">
        <span class="tip-marker" style="background:${col}"></span>
        <span class="tip-title">${escapeHTML(name)}</span>
      </div>
      ${stName ? `<div class="tip-state">${escapeHTML(titleCase(stName))}</div>` : ""}
      <div class="tip-row"><span>Actual</span><span>${V.formatActual(a)}</span></div>
      <div class="tip-row"><span>Normal</span><span>${V.formatNormal(n)}</span></div>
      <div class="tip-row"><span>${V.measureLabel}</span><span>${V.formatMeasure(d)}</span></div>
      <span class="tip-cat" style="background:${col};color:${contrastText(col)}">${escapeHTML(cat)}</span>
    `;
    layer.bindTooltip(html, { sticky: true, direction: "top", className: "district-tip", offset: [0, -6] }).openTooltip();
  }

  // ===========================================================
  // District selection (state-aware)
  // ===========================================================

  async function selectDistrict(name, stName, { fromMap = false } = {}) {
    // Resolve the state when the caller didn't specify it.
    const states = stateOf(name);
    if (!stName) {
      if (states.length === 1) stName = states[0];
      else {
        const sel = $("#stateSelect").value;
        stName = states.includes(sel) ? sel : states[0];
      }
    }
    state.selectedDistrict = name;
    state.selectedState = stName;

    if (state.selectedLayer) state.selectedLayer.setStyle({ weight: 0.3, color: "rgba(33,43,54,0.25)" });

    const layer = state.districtLayer.get(LK(name, stName))
      || (state.layersByName.get(name) || [])[0]?.layer;
    if (layer) {
      state.selectedLayer = layer;
      layer.setStyle({ weight: 2.4, color: "#0BAFAF" });
      layer.bringToFront();
      showSelectedLabel(name, layer.getBounds().getCenter());
      if (!fromMap) state.map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 8 });
    }
    syncLocationSelectorsTo(name, stName);
    updateDetail(name, stName);

    try {
      const ts = await getTimeseries();
      drawTrendChart(name, ts[name] || []);
    } catch (err) { console.error(err); }
  }

  function updateDetail(name, stName) {
    const V = v();
    $("#detailTitle").textContent = name;
    const st = stName || (stateOf(name)[0] || "");
    $("#detailSub").textContent =
      `${st ? titleCase(st) + " · " : ""}Week ${state.currentWeekData.week} · ${MONTH_NAMES[state.currentWeekData.month-1]} ${state.currentWeekData.year}`;
    $("#detailBody").hidden = false;

    const rec = state.currentWeekData.districts[name];
    const a = rec?.[V.fields.actual];
    const n = rec?.[V.fields.normal];
    const d = rec?.[V.fields.measure];
    const cat = rec?.[V.fields.category] || "No Data";

    $("#metActual").textContent = a == null ? "—" : Number(a).toFixed(1);
    $("#metNormal").textContent = n == null ? "—" : Number(n).toFixed(1);
    $("#metDeviation").textContent = d == null ? "—" : (d > 0 ? "+" : "") + Number(d).toFixed(V.id === "rainfall" ? 1 : 2);

    const pill = $("#metCategory");
    const col = catColor(cat);
    pill.textContent = cat;
    pill.style.background = col;
    pill.style.color = contrastText(col);
  }

  // ===========================================================
  // Hero stats
  // ===========================================================

  function updateHeroStats() {
    const V = v();
    const catField = V.fields.category;
    const districts = state.currentWeekData?.districts || {};
    let surplus = 0, deficit = 0, total = 0;
    Object.values(districts).forEach(d => {
      total++;
      const c = d?.[catField];
      if (V.surplusKeys.has(c)) surplus++;
      else if (V.deficitKeys.has(c)) deficit++;
    });
    animateNumber($("#heroSurplus"), surplus);
    animateNumber($("#heroDeficit"), deficit);
    $("#heroSurplusPct").textContent = total ? `${((surplus/total)*100).toFixed(0)}%` : "—";
    $("#heroDeficitPct").textContent = total ? `${((deficit/total)*100).toFixed(0)}%` : "—";
  }

  // ===========================================================
  // Distribution — doughnut + compact legend
  // ===========================================================

  function updateSummary() {
    const V = v();
    const catField = V.fields.category;
    const districts = state.currentWeekData?.districts || {};
    const visibleCats = V.categories.filter(c => c.key !== "No Data");
    const counts = Object.fromEntries(visibleCats.map(c => [c.key, 0]));
    let withData = 0, total = 0;
    Object.values(districts).forEach(d => {
      total++;
      const c = d?.[catField];
      if (!c || c === "No Data") return;
      if (counts[c] !== undefined) counts[c]++;
      withData++;
    });

    $("#summaryCount").textContent = withData === total ? `${total} districts` : `${withData} of ${total} districts`;

    const present = visibleCats.filter(c => counts[c.key] > 0);

    // --- Doughnut ---
    const cfg = {
      type: "doughnut",
      data: {
        labels: present.map(c => c.key),
        datasets: [{
          data: present.map(c => counts[c.key]),
          backgroundColor: present.map(c => c.color),
          borderColor: "#fff", borderWidth: 1.5, hoverOffset: 4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "58%",
        animation: { duration: 350 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#fff", borderColor: "#E4E8EB", borderWidth: 1,
            titleColor: "#212B36", bodyColor: "#637381", padding: 9, cornerRadius: 6, displayColors: true,
            titleFont: { family: "Roboto", size: 11.5, weight: "700" },
            bodyFont: { family: "Roboto", size: 11 },
            callbacks: {
              label: ctx => {
                const n = ctx.parsed;
                const pct = withData ? (n / withData * 100).toFixed(1) : 0;
                return `${n} districts · ${pct}%`;
              },
            },
          },
        },
      },
    };
    if (state.pieChart) state.pieChart.destroy();
    state.pieChart = new Chart($("#summaryPie"), cfg);

    // --- Legend (top 6 by count to keep it on one page) ---
    const ranked = [...present].sort((a, b) => counts[b.key] - counts[a.key]);
    const top = ranked.slice(0, 6);
    const restN = ranked.slice(6).reduce((s, c) => s + counts[c.key], 0);
    let html = top.map(c => {
      const n = counts[c.key];
      const pct = withData ? (n / withData * 100).toFixed(0) : 0;
      return `<li>
        <span class="leg-name"><span class="leg-swatch" style="background:${c.color}"></span>${escapeHTML(c.key)}</span>
        <span class="leg-val">${n} · ${pct}%</span>
      </li>`;
    }).join("");
    if (restN > 0) {
      const pct = withData ? (restN / withData * 100).toFixed(0) : 0;
      html += `<li><span class="leg-name" style="color:var(--text-3)">+ ${ranked.length - 6} more</span><span class="leg-val">${restN} · ${pct}%</span></li>`;
    }
    $("#summaryLegend").innerHTML = html;
  }

  // ===========================================================
  // Trend chart
  // ===========================================================

  function drawTrendChart(name, fullSeries) {
    const V = v();
    const year = Number($("#yearSelect").value);
    $("#chartYear").textContent = year;

    const safe = Array.isArray(fullSeries) ? fullSeries : [];
    const series = safe.filter(r => r && typeof r.key === "string" && r.key.startsWith(`${year}-`));
    const labels = series.map(r => trajectoryLabel(r.key));
    const actual = series.map(r => r[V.fields.actual]);
    const normal = series.map(r => r[V.fields.normal]);
    const pointColors = series.map(r => {
      const a = r[V.fields.actual], n = r[V.fields.normal];
      if (a == null || n == null) return "#9AA7B2";
      return a >= n ? V.surplusColor : V.deficitColor;
    });

    const cfg = {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Actual", data: actual,
            borderColor: "#0BAFAF", borderWidth: 1.8, tension: 0.3,
            pointRadius: 2, pointHoverRadius: 4.5,
            pointBackgroundColor: pointColors, pointBorderColor: "#fff", pointBorderWidth: 1,
            fill: { target: 1, above: hexToRgba(V.surplusColor, 0.20), below: hexToRgba(V.deficitColor, 0.20) },
            spanGaps: true, order: 1,
          },
          {
            label: "Normal", data: normal,
            borderColor: "#919EAB", borderWidth: 1, borderDash: [4, 4], tension: 0.3,
            pointRadius: 0, pointHoverRadius: 0, fill: false, spanGaps: true, order: 2,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: { left: 0, right: 6, top: 6, bottom: 0 } },
        animation: { duration: 350 },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#fff", borderColor: "#E4E8EB", borderWidth: 1,
            titleColor: "#212B36", bodyColor: "#637381",
            titleFont: { family: "Roboto", size: 11.5, weight: "700" },
            bodyFont: { family: "Roboto", size: 11 },
            padding: 10, displayColors: false, cornerRadius: 6,
            callbacks: {
              title: ctx => ctx[0].label,
              label: ctx => {
                const r = series[ctx.dataIndex];
                const a = r[V.fields.actual], n = r[V.fields.normal];
                const above = (a != null && n != null && a >= n);
                return [
                  `Actual:  ${V.formatActual(a)}`,
                  `Normal:  ${V.formatNormal(n)}`,
                  `${V.measureLabel}: ${V.formatMeasure(r[V.fields.measure])}`,
                  above ? "↑ Above normal" : "↓ Below normal",
                ];
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { font: { family: "Roboto", size: 9.5 }, color: "#919EAB", maxRotation: 0, autoSkip: true, maxTicksLimit: 9 },
            grid: { display: false }, border: { color: "#E4E8EB" },
          },
          y: {
            beginAtZero: V.id === "rainfall",
            ticks: { font: { family: "Roboto", size: 9.5 }, color: "#919EAB", callback: val => `${val} ${V.yAxisUnit}` },
            grid: { color: "#EEF1F3" }, border: { display: false },
          },
        },
      },
    };

    if (state.trendChart) state.trendChart.destroy();
    state.trendChart = new Chart($("#trendChart"), cfg);
  }

  function trajectoryLabel(key) {
    const m = key.match(/^(\d{4})-(\d{2})-W(\d)$/);
    if (!m) return key;
    return `${MONTH_NAMES[Number(m[2]) - 1].slice(0,3)} W${m[3]}`;
  }

  // ===========================================================
  // District labels (state-aware keys)
  // ===========================================================

  function buildLabelMarkers() {
    state.geojsonLayer.eachLayer(layer => {
      const name = layer.feature.properties[DISTRICT_KEY];
      const st = layer.feature.properties[STATE_KEY] || "—";
      const bounds = layer.getBounds();
      const ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
      state.districtLabels.set(LK(name, st), {
        name, latlng: bounds.getCenter(),
        area: Math.abs((ne.lat - sw.lat) * (ne.lng - sw.lng)),
        isImportant: IMPORTANT_DISTRICTS_LC.has(String(name).toLowerCase().trim()),
        marker: null,
      });
    });
  }

  function scheduleLabelRefresh() {
    if (state.labelFrame) cancelAnimationFrame(state.labelFrame);
    state.labelFrame = requestAnimationFrame(refreshLabels);
  }

  function refreshLabels() {
    if (!state.map) return;
    const zoom = state.map.getZoom();
    const bounds = state.map.getBounds();
    state.districtLabels.forEach(info => {
      let shouldShow = false;
      if (zoom >= 9) shouldShow = bounds.contains(info.latlng);
      else if (zoom >= 7) shouldShow = info.isImportant && bounds.contains(info.latlng);
      if (shouldShow) {
        if (!info.marker) {
          info.marker = L.marker(info.latlng, {
            icon: L.divIcon({
              className: "district-label" + (info.isImportant ? " is-important-label" : ""),
              html: escapeHTML(info.name), iconSize: [150, 14], iconAnchor: [75, 7],
            }),
            interactive: false, pane: "labels", keyboard: false,
          });
        }
        if (!info.marker._map) info.marker.addTo(state.map);
      } else if (info.marker?._map) {
        state.map.removeLayer(info.marker);
      }
    });
  }

  function showSelectedLabel(name, latlng) {
    if (state.selectedLabel) state.map.removeLayer(state.selectedLabel);
    state.selectedLabel = L.marker(latlng, {
      icon: L.divIcon({
        className: "district-label is-selected-label",
        html: escapeHTML(name), iconSize: [180, 16], iconAnchor: [90, 8],
      }),
      interactive: false, pane: "labels", keyboard: false,
    }).addTo(state.map);
  }

  // ===========================================================
  // Bottom legend
  // ===========================================================

  function buildLegend() {
    const V = v();
    const items = V.categories.filter(c => c.key !== "No Data").map(c => {
      const dup = c.range.startsWith(c.key);
      return `<div class="legend-item">
          <span class="legend-swatch" style="background:${c.color}"></span>
          ${dup ? "" : `<span>${c.key}</span>`}
          <span class="legend-range">${c.range}</span>
        </div>`;
    }).join("");
    $("#legendBar").innerHTML = `<span class="legend-title" id="legendTitle">${escapeHTML(V.legendTitle)}</span>` + items;
  }

  // ===========================================================
  // Chrome: about dialog + action-bar buttons
  // ===========================================================

  function wireChrome() {
    const scrim = $("#aboutScrim");
    const close = () => scrim.hidden = true;
    $("#helpBtn").addEventListener("click", () => scrim.hidden = false);
    $("#aboutClose").addEventListener("click", close);
    scrim.addEventListener("click", e => { if (e.target === scrim) close(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

    $("#resetViewBtn").addEventListener("click", () => {
      if (state.geojsonLayer) state.map.fitBounds(state.geojsonLayer.getBounds(), { padding: [10, 10] });
    });
  }

  // ===========================================================
  // Misc
  // ===========================================================

  function animateNumber(el, end, duration = 500) {
    const start = parseInt(el.textContent, 10);
    const from = Number.isFinite(start) ? start : 0;
    if (!Number.isFinite(end)) { el.textContent = "—"; return; }
    const t0 = performance.now();
    const range = end - from;
    function tick(t) {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + range * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function hideLoading() {
    requestAnimationFrame(() => $("#loadingScreen").classList.add("is-hidden"));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
