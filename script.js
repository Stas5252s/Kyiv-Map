/* ══════════════════════════════════════════════
           CATEGORIES — кожна = ОДИН OSM-запит
        ══════════════════════════════════════════════ */
const CATS = {
  cafe: {
    label: "Кафе / Кав'ярні",
    emoji: "☕",
    color: "#f5a623",
    osm: `node["amenity"~"^(cafe|coffee_shop)$"](bbox);`,
  },
  restaurant: {
    label: "Ресторани",
    emoji: "🍽️",
    color: "#3ecf8e",
    osm: `node["amenity"="restaurant"](bbox);`,
  },
  fastfood: {
    label: "Фастфуд",
    emoji: "🍔",
    color: "#fbbf24",
    osm: `node["amenity"="fast_food"](bbox);`,
  },
  bar: {
    label: "Бари / Паби",
    emoji: "🍺",
    color: "#e9855c",
    osm: `node["amenity"~"^(bar|pub|nightclub)$"](bbox);`,
  },
  cinema: {
    label: "Кінотеатри",
    emoji: "🎬",
    color: "#a78bfa",
    osm: `node["amenity"="cinema"](bbox);`,
  },
  theatre: {
    label: "Театри",
    emoji: "🎭",
    color: "#c084fc",
    osm: `node["amenity"="theatre"](bbox);`,
  },
  museum: {
    label: "Музеї",
    emoji: "🏛️",
    color: "#f06292",
    osm: `node["tourism"="museum"](bbox);`,
  },
  hotel: {
    label: "Готелі",
    emoji: "🏨",
    color: "#67e8f9",
    osm: `node["tourism"~"^(hotel|hostel|guest_house)$"](bbox);`,
  },
  pharmacy: {
    label: "Аптеки",
    emoji: "💊",
    color: "#fb923c",
    osm: `node["amenity"="pharmacy"](bbox);`,
  },
  hospital: {
    label: "Лікарні / Клініки",
    emoji: "🏥",
    color: "#f87171",
    osm: `node["amenity"~"^(hospital|clinic)$"](bbox);`,
  },
  supermarket: {
    label: "Супермаркети",
    emoji: "🛒",
    color: "#4ade80",
    osm: `node["shop"~"^(supermarket|convenience)$"](bbox);`,
  },
  electronics: {
    label: "Електроніка",
    emoji: "💻",
    color: "#4f9cf9",
    osm: `node["shop"~"^(electronics|computer|mobile_phone)$"](bbox);`,
  },
  clothes: {
    label: "Одяг / Мода",
    emoji: "👗",
    color: "#f472b6",
    osm: `node["shop"="clothes"](bbox);`,
  },
  bank: {
    label: "Банки / АТМ",
    emoji: "🏦",
    color: "#86efac",
    osm: `node["amenity"~"^(bank|atm)$"](bbox);`,
  },
  gym: {
    label: "Спортзали / Фітнес",
    emoji: "🏋️",
    color: "#fb7185",
    osm: `node["leisure"~"^(fitness_centre|sports_centre|gym)$"](bbox);`,
  },
  fuel: {
    label: "АЗС",
    emoji: "⛽",
    color: "#94a3b8",
    osm: `node["amenity"="fuel"](bbox);`,
  },
  school: {
    label: "Школи",
    emoji: "🏫",
    color: "#fcd34d",
    osm: `node["amenity"="school"](bbox);`,
  },
  university: {
    label: "Університети",
    emoji: "🎓",
    color: "#c4b5fd",
    osm: `node["amenity"~"^(university|college)$"](bbox);`,
  },
  church: {
    label: "Церкви / Храми",
    emoji: "⛪",
    color: "#d4b896",
    osm: `node["amenity"="place_of_worship"](bbox);`,
  },
  park: {
    label: "Парки",
    emoji: "🌳",
    color: "#6ee7b7",
    osm: `node["leisure"="park"](bbox);way["leisure"="park"](bbox);`,
  },
};

const BBOX = "50.213,30.239,50.591,30.825";
const CACHE = {}; // catKey → Place[]
let activeCat = null;
let searchQ = "";

/* ══════════════════════════════════════════════
           MAP
        ══════════════════════════════════════════════ */
const map = L.map("map", {
  center: [50.4501, 30.5234],
  zoom: 13,
  dragging: true,
  scrollWheelZoom: true,
  doubleClickZoom: true,
  touchZoom: true,
});

const TILE_DARK =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_LIGHT =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
let tileLayer = L.tileLayer(TILE_DARK, {
  attribution: "&copy; OpenStreetMap &copy; CARTO",
  subdomains: "abcd",
  maxZoom: 19,
}).addTo(map);

/* ══════════════════════════════════════════════
           CLUSTER
        ══════════════════════════════════════════════ */
function newCluster() {
  const dark = document.body.dataset.theme === "dark";
  return L.markerClusterGroup({
    maxClusterRadius: 50,
    showCoverageOnHover: false,
    chunkedLoading: true,
    iconCreateFunction(c) {
      const n = c.getChildCount();
      const col = dark ? "#4f9cf9" : "#2478e8";
      return L.divIcon({
        html: `<div style="width:36px;height:36px;border-radius:50%;display:flex;
          align-items:center;justify-content:center;
          background:${dark ? "rgba(79,156,249,.16)" : "rgba(36,120,232,.12)"};
          border:2px solid ${
            dark ? "rgba(79,156,249,.5)" : "rgba(36,120,232,.4)"
          };
          font-family:Unbounded,sans-serif;font-weight:700;font-size:.68rem;color:${col}">${n}</div>`,
        iconSize: [36, 36],
        className: "",
      });
    },
  });
}
let cluster = newCluster();
map.addLayer(cluster);

/* ══════════════════════════════════════════════
           ICONS
        ══════════════════════════════════════════════ */
function mkIcon(catKey) {
  const c = CATS[catKey] || { emoji: "📍", color: "#4f9cf9" };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
    <path d="M15 0C8.93 0 4 4.93 4 11c0 7.59 11 27 11 27S26 18.59 26 11C26 4.93 21.07 0 15 0z"
          fill="${c.color}" opacity=".92"/>
    <circle cx="15" cy="11" r="7" fill="rgba(0,0,0,.28)"/>
    <text x="15" y="15" text-anchor="middle" dominant-baseline="middle"
          font-size="8.5" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${c.emoji}</text>
  </svg>`;
  return L.divIcon({
    html: `<div style="filter:drop-shadow(0 2px 5px ${c.color}88)">${svg}</div>`,
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -40],
    className: "",
  });
}

/* ══════════════════════════════════════════════
           RENDER
        ══════════════════════════════════════════════ */
function renderPlaces(places) {
  cluster.clearLayers();
  const q = searchQ.toLowerCase();
  const list = q
    ? places.filter((p) => p.name.toLowerCase().includes(q))
    : places;

  list.forEach((p) => {
    const c = CATS[p.cat] || {};
    const m = L.marker([p.lat, p.lng], { icon: mkIcon(p.cat) });
    m.bindPopup(
      L.popup({ minWidth: 162 }).setContent(
        `<div class="p-inner">
        <div class="p-cat" style="color:${c.color}">${c.emoji || ""} ${
          c.label || p.cat
        }</div>
        <div class="p-name">${p.name}</div>
        ${p.addr ? `<div class="p-addr">📍 ${p.addr}</div>` : ""}
      </div>`
      )
    );
    m.on("mouseover", function () {
      this.openPopup();
      const el = this.getElement();
      if (el)
        el.style.filter = `brightness(1.4) drop-shadow(0 0 6px ${
          c.color || "#4f9cf9"
        })`;
    });
    m.on("mouseout", function () {
      const el = this.getElement();
      if (el) el.style.filter = "";
    });
    cluster.addLayer(m);
  });

  const n = list.length;
  const badge = document.getElementById("badge");
  badge.textContent = n.toLocaleString("uk") + " об'єктів";
  const none = n === 0;
  badge.style.color = none ? "#f06292" : "";
  badge.style.background = none ? "rgba(240,98,146,.12)" : "";
  badge.style.borderColor = none ? "rgba(240,98,146,.28)" : "";
  document.getElementById("empty").classList.toggle("on", none);
}

/* ══════════════════════════════════════════════
           OVERPASS — SINGLE REQUEST PER CATEGORY
        ══════════════════════════════════════════════ */
let abortCtrl = null;

async function fetchCat(catKey) {
  if (CACHE[catKey]) return CACHE[catKey];

  // abort previous in-flight request
  if (abortCtrl) {
    abortCtrl.abort();
  }
  abortCtrl = new AbortController();

  const cfg = CATS[catKey];
  const body = cfg.osm.replaceAll("(bbox)", `(${BBOX})`);
  const ql = `[out:json][timeout:30];(${body});out center 3000;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(ql),
    signal: abortCtrl.signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const places = (json.elements || [])
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      const tags = el.tags || {};
      const name = tags.name || tags["name:uk"] || tags["name:en"] || cfg.label;
      const addr = [tags["addr:street"], tags["addr:housenumber"]]
        .filter(Boolean)
        .join(" ");
      if (!lat || !lng) return null;
      return { name, lat, lng, addr, cat: catKey };
    })
    .filter(Boolean);

  CACHE[catKey] = places;
  return places;
}

/* ══════════════════════════════════════════════
           LOAD & SHOW
        ══════════════════════════════════════════════ */
function setLoader(on, text = "Завантаження…", sub = "Запит до OpenStreetMap") {
  document.getElementById("loader").classList.toggle("hidden", !on);
  document.getElementById("loaderText").textContent = text;
  document.getElementById("loaderSub").textContent = sub;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("on");
  setTimeout(() => t.classList.remove("on"), 4000);
}

async function loadCat(catKey) {
  activeCat = catKey;
  searchQ = "";
  document.getElementById("search").value = "";

  // update active states
  document
    .querySelectorAll(".cat-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === catKey));

  closeSidebar();
  setLoader(
    true,
    `Завантаження: ${CATS[catKey].label}`,
    CACHE[catKey] ? "З кешу…" : "Запит до OpenStreetMap…"
  );

  try {
    const places = await fetchCat(catKey);
    renderPlaces(places);
    // update count in sidebar
    const cnt = document.querySelector(
      `.cat-btn[data-cat="${catKey}"] .cat-cnt`
    );
    if (cnt) cnt.textContent = places.length.toLocaleString("uk") + " місць";
  } catch (e) {
    if (e.name === "AbortError") return; // user switched category
    console.error(e);
    const code = e.message || "";
    if (code.includes("429"))
      showToast("⏳ Сервер перевантажений — спробуйте через 30 сек");
    else if (code.includes("504"))
      showToast("⏱️ Таймаут запиту — спробуйте ще раз");
    else showToast("⚠️ Помилка завантаження: " + code);
  } finally {
    setLoader(false);
  }
}

/* ══════════════════════════════════════════════
           SIDEBAR BUILD
        ══════════════════════════════════════════════ */
function buildSidebar() {
  const list = document.getElementById("catList");
  list.innerHTML = "";
  Object.entries(CATS).forEach(([key, cfg]) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn";
    btn.dataset.cat = key;
    btn.style.setProperty("--cat-color", cfg.color);
    btn.innerHTML = `
      <div class="cat-icon">${cfg.emoji}</div>
      <div class="cat-info">
        <span class="cat-name">${cfg.label}</span>
        <span class="cat-cnt">клікніть для завантаження</span>
      </div>
      <div class="cat-dot"></div>`;
    btn.addEventListener("click", () => loadCat(key));
    list.appendChild(btn);
  });
}

/* ══════════════════════════════════════════════
           THEME
        ══════════════════════════════════════════════ */
let isDark = true;
function applyTheme(dark) {
  isDark = dark;
  document.body.dataset.theme = dark ? "dark" : "light";
  document.getElementById("themeBtn").textContent = dark ? "🌙" : "☀️";
  map.removeLayer(tileLayer);
  tileLayer = L.tileLayer(dark ? TILE_DARK : TILE_LIGHT, {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);
  // refresh cluster icons
  const layers = cluster.getLayers();
  map.removeLayer(cluster);
  cluster = newCluster();
  layers.forEach((l) => cluster.addLayer(l));
  map.addLayer(cluster);
}
document
  .getElementById("themeBtn")
  .addEventListener("click", () => applyTheme(!isDark));

/* ══════════════════════════════════════════════
           MOBILE SIDEBAR
        ══════════════════════════════════════════════ */
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sb-overlay").classList.add("on");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sb-overlay").classList.remove("on");
}
document.getElementById("sbToggle").addEventListener("click", openSidebar);
document.getElementById("sb-overlay").addEventListener("click", closeSidebar);

/* ══════════════════════════════════════════════
           SEARCH (filters already-loaded data)
        ══════════════════════════════════════════════ */
let searchTimer;
document.getElementById("search").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQ = e.target.value.trim();
    if (activeCat && CACHE[activeCat]) renderPlaces(CACHE[activeCat]);
  }, 200);
});

/* ══════════════════════════════════════════════
           BOOT — show welcome hint, load default cat
        ══════════════════════════════════════════════ */
buildSidebar();

// Load cafes as default to show something right away
loadCat("cafe");
