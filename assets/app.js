
const CSV_PATH = "data/match_data.csv";

// Mapping EXACT selon ton fichier
const COL = {
  id: "Match_id",
  date: "Date",             // format DD/MM/YYYY
  competition: "Tournoi",
  phase: "Stade compet",
  home: "home_team",
  away: "away_team",
  video: "LINK"
};

const el = {
  status: document.getElementById("status"),
  count: document.getElementById("count"),
  list: document.getElementById("list"),
  empty: document.getElementById("empty"),

  dateFrom: document.getElementById("dateFrom"),
  dateTo: document.getElementById("dateTo"),
  competition: document.getElementById("competition"),
  phase: document.getElementById("phase"),
  team: document.getElementById("team"),
  q: document.getElementById("q"),
  resetBtn: document.getElementById("resetBtn"),
};

let MATCHES = [];

function normalizeStr(s) {
  return (s ?? "").toString().trim();
}
function safeLower(s) {
  return normalizeStr(s).toLowerCase();
}

// Parse DD/MM/YYYY -> Date
function parseFRDate(s) {
  s = normalizeStr(s);
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateFR(dateObj) {
  if (!dateObj) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric", month: "2-digit", day: "2-digit"
  }).format(dateObj);
}

function uniqSorted(arr) {
  const set = new Set(arr.filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}

function setSelectOptions(selectEl, values, placeholder = "Toutes") {
  const current = selectEl.value;
  selectEl.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder;
  selectEl.appendChild(opt0);

  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  });

  if ([...selectEl.options].some(o => o.value === current)) {
    selectEl.value = current;
  }
}

function escapeHtml(str) {
  return normalizeStr(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function mapRowToMatch(row) {
  const dateRaw = row[COL.date];
  const dateObj = parseFRDate(dateRaw);

  const home = normalizeStr(row[COL.home]);
  const away = normalizeStr(row[COL.away]);

  return {
    id: normalizeStr(row[COL.id]),
    dateRaw: normalizeStr(dateRaw),
    dateObj,
    competition: normalizeStr(row[COL.competition]),
    phase: normalizeStr(row[COL.phase]),
    home,
    away,
    video: normalizeStr(row[COL.video]),
    searchBlob: safeLower([
      row[COL.id], dateRaw, row[COL.competition], row[COL.phase], home, away, row[COL.video]
    ].join(" | "))
  };
}

function inferMinMaxDates(matches) {
  const dates = matches.map(m => m.dateObj).filter(Boolean).sort((a,b)=>a-b);
  if (!dates.length) return { min: null, max: null };
  return { min: dates[0], max: dates[dates.length - 1] };
}

function applyFilters() {
  const from = el.dateFrom.value ? new Date(el.dateFrom.value + "T00:00:00") : null;
  const to = el.dateTo.value ? new Date(el.dateTo.value + "T23:59:59") : null;
  const comp = el.competition.value;
  const phase = el.phase.value;
  const team = el.team.value;
  const q = safeLower(el.q.value);

  let filtered = MATCHES.filter(m => {
    if ((from || to) && !m.dateObj) return false;
    if (from && m.dateObj < from) return false;
    if (to && m.dateObj > to) return false;

    if (comp && m.competition !== comp) return false;
    if (phase && m.phase !== phase) return false;

    if (team && !(m.home === team || m.away === team)) return false;

    if (q && !m.searchBlob.includes(q)) return false;

    return true;
  });

  // tri : date desc
  filtered.sort((a, b) => (b.dateObj?.getTime() ?? 0) - (a.dateObj?.getTime() ?? 0));

  render(filtered);
}

function render(matches) {
  el.list.innerHTML = "";
  el.empty.classList.toggle("hidden", matches.length !== 0);
  el.count.textContent = `${matches.length} match(s)`;

  const frag = document.createDocumentFragment();

  matches.forEach(m => {
    const card = document.createElement("article");
    card.className = "card";

    const title = `${m.home} vs ${m.away}`;
    const dateLabel = m.dateObj ? formatDateFR(m.dateObj) : m.dateRaw;

    card.innerHTML = `
      <div class="card__top">
        <div>
          <div class="card__title">${escapeHtml(title)}</div>
          <div class="card__meta">
            <span class="meta-item">🆔 <code>${escapeHtml(m.id)}</code></span>
            <span class="meta-item">📅 <code>${escapeHtml(dateLabel)}</code></span>
          </div>
        </div>
        <div class="badges">
          ${m.competition ? `<span class="badge badge--accent">${escapeHtml(m.competition)}</span>` : ""}
          ${m.phase ? `<span class="badge badge--phase">${escapeHtml(m.phase)}</span>` : ""}
        </div>
      </div>

      <div class="card__actions">
        ${m.video
          ? `<a class="btn" href="${escapeHtml(mdéo</a>`
          : `<span class="badge">Pas de lien</span>`
        }
        <button class="btn btn--ghost" data-copy="${escapeHtml(m.video || "")}" ${m.video ? "" : "disabled"}>📋 Copier</button>
      </div>
    `;

    const copyBtn = card.querySelector("button[data-copy]");
    if (copyBtn && m.video) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(m.video);
          copyBtn.textContent = "✅ Copié";
          setTimeout(() => (copyBtn.textContent = "📋 Copier"), 1200);
        } catch {
          alert("Copie impossible (restriction navigateur).");
        }
      });
    }

    frag.appendChild(card);
  });

  el.list.appendChild(frag);
}

async function loadCSV() {
  el.status.textContent = "Chargement du CSV…";

  const res = await fetch(CSV_PATH, { cache: "no-store" });
  if (!res.ok) throw new Error(`Impossible de charger ${CSV_PATH} (${res.status})`);

  const text = await res.text();

  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: ";", // IMPORTANT : ton CSV est en ;
  });

  MATCHES = (parsed.data || []).map(mapRowToMatch);

  // remplir dropdowns
  const competitions = uniqSorted(MATCHES.map(m => m.competition));
  const phases = uniqSorted(MATCHES.map(m => m.phase));
  const teams = uniqSorted(MATCHES.flatMap(m => [m.home, m.away]));

  setSelectOptions(el.competition, competitions, "Toutes");
  setSelectOptions(el.phase, phases, "Toutes");
  setSelectOptions(el.team, teams, "Toutes");

  const { min, max } = inferMinMaxDates(MATCHES);
  if (min && max) {
    el.status.textContent = `CSV chargé — ${formatDateFR(min)} → ${formatDateFR(max)}`;
  } else {
    el.status.textContent = "CSV chargé";
  }

  applyFilters();
}

function wireEvents() {
  const handler = () => applyFilters();

  el.dateFrom.addEventListener("input", handler);
  el.dateTo.addEventListener("input", handler);
  el.competition.addEventListener("change", handler);
  el.phase.addEventListener("change", handler);
  el.team.addEventListener("change", handler);
  el.q.addEventListener("input", handler);

  el.resetBtn.addEventListener("click", () => {
    el.dateFrom.value = "";
    el.dateTo.value = "";
    el.competition.value = "";
    el.phase.value = "";
    el.team.value = "";
    el.q.value = "";
    applyFilters();
  });
}

(async function init() {
  try {
    wireEvents();
    await loadCSV();
  } catch (err) {
    console.error(err);
    el.status.textContent = "❌ Erreur de chargement (voir console).";
    el.status.style.color = "rgba(255,200,200,0.95)";
  }
})();
