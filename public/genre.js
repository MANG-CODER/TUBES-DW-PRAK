// ==========================================
// 1. INIT VARIABLES
// ==========================================
const GENRE_LIST_API = "https://www.sankavollerei.com/anime/genre";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

const genreContainer = document.getElementById("genreContainer");
const genreFilter = document.getElementById("genreFilter");
const filterSection = document.getElementById("filterSection");
const pageTitle = document.getElementById("pageTitle");
const pageDesc = document.getElementById("pageDesc");

const searchInput = document.getElementById("searchInput");
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

let globalGenreList = [];

// Warna untuk kotak genre (List Genre)
const colors = [
  "hover:border-purple-500 hover:shadow-purple-500/20 text-purple-400",
  "hover:border-blue-500 hover:shadow-blue-500/20 text-blue-400",
  "hover:border-green-500 hover:shadow-green-500/20 text-green-400",
  "hover:border-pink-500 hover:shadow-pink-500/20 text-pink-400",
  "hover:border-yellow-500 hover:shadow-yellow-500/20 text-yellow-400",
  "hover:border-cyan-500 hover:shadow-cyan-500/20 text-cyan-400",
  "hover:border-red-500 hover:shadow-red-500/20 text-red-400",
];

// ==========================
// 2. NAVIGASI (MENU SANDWICH)
// ==========================
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 3. FUNGSI RESET (KEMBALI KE LIST GENRE)
// ==========================
function resetToGenreList() {
  if (pageTitle) pageTitle.innerText = "🧩 Jelajahi Genre";
  if (pageDesc) pageDesc.style.display = "block";
  if (filterSection) filterSection.style.display = "block";

  // Render Ulang Genre dari memory
  if (globalGenreList.length > 0) {
    renderGenres(globalGenreList);
  } else {
    loadGenres();
  }
}

// ==========================
// 4. LOGIKA SEARCH (LIVE SEARCH ANIME)
// ==========================
async function handleLiveSearch(query) {
  const cleanQuery = query.trim();

  // A. KEMBALI KE MODE GENRE (Jika input < 3 huruf)
  if (cleanQuery.length < 3) {
    resetToGenreList();
    return;
  }

  // B. MODE SEARCH ANIME
  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil:</span> "${cleanQuery}"`;
  if (pageDesc) pageDesc.style.display = "none";
  if (filterSection) filterSection.style.display = "none";

  genreContainer.innerHTML = `<div class="col-span-full text-center text-white animate-pulse py-10">Mencari anime "${cleanQuery}"...</div>`;

  try {
    const res = await fetch(`${SEARCH_API}${cleanQuery}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    if (genreContainer) genreContainer.innerHTML = "";

    if (list.length > 0) {
      list.forEach((anime) => renderAnimeCard(genreContainer, anime));
    } else {
      genreContainer.innerHTML = `<div class="col-span-full text-center text-slate-400">Tidak ditemukan anime.</div>`;
    }
  } catch (e) {
    console.error(e);
    genreContainer.innerHTML = `<div class="col-span-full text-center text-red-400">Error saat mencari.</div>`;
  }
}

// Event Listener Search
if (searchInput)
  searchInput.addEventListener("keyup", (e) =>
    handleLiveSearch(e.target.value)
  );
if (mobileSearchForm && mobileSearchInput) {
  mobileSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    mobileSearchInput.blur();
    handleLiveSearch(mobileSearchInput.value);
  });
}

// ==========================
// 5. FILTER LOKAL (GENRE LIST)
// ==========================
if (genreFilter) {
  genreFilter.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = globalGenreList.filter((g) =>
      g.title.toLowerCase().includes(term)
    );
    renderGenres(filtered);
  });
}

// ==========================
// 6. FETCH & RENDER: LIST GENRE
// ==========================
async function loadGenres() {
  const cacheKey = "genre-list";
  const cached = getCache(cacheKey);

  if (cached) {
    globalGenreList = cached;
    renderGenres(cached);
    return;
  }

  try {
    const res = await fetch(GENRE_LIST_API);
    const json = await res.json();

    if (json.status === "success" && json.data && json.data.genreList) {
      setCache(cacheKey, json.data.genreList);
      globalGenreList = json.data.genreList;
      renderGenres(json.data.genreList);
    } else {
      genreContainer.innerHTML = `<p class="col-span-full text-center text-red-400">Gagal memuat genre.</p>`;
    }
  } catch (e) {
    console.error(e);
    genreContainer.innerHTML = `<p class="col-span-full text-center text-red-400">Terjadi kesalahan koneksi.</p>`;
  }
}

function renderGenres(list) {
  genreContainer.innerHTML = "";
  if (list.length === 0) {
    genreContainer.innerHTML = `<p class="col-span-full text-center text-slate-500 italic">Genre tidak ditemukan.</p>`;
    return;
  }

  list.forEach((genre, index) => {
    const colorClass = colors[index % colors.length];

    // Link ke halaman detail genre
    const card = document.createElement("a");
    card.href = `genre-result.html?id=${genre.genreId}`;

    card.className = `group bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 ${colorClass}`;
    card.innerHTML = `
        <div class="mb-3 p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 transition">
            <span class="text-2xl opacity-80 group-hover:opacity-100 transition transform group-hover:scale-110 block">
                ${getIconForGenre(genre.title)}
            </span>
        </div>
        <h3 class="font-bold text-sm sm:text-base text-slate-200 group-hover:text-white transition">
            ${genre.title}
        </h3>
    `;
    genreContainer.appendChild(card);
  });
}

// ==========================
// 7. RENDER ANIME CARD (GAYA SAMA PERSIS DENGAN GENRE-RESULT.JS)
// ==========================
function renderAnimeCard(container, anime) {
  const slug = anime.animeId || anime.href?.split("/").pop() || "#";
  const poster = anime.poster || "https://via.placeholder.com/300x450";

  // Logika Info Badge: Mengutamakan Score, lalu Type/Status
  const info = anime.score
    ? `⭐ ${anime.score}`
    : anime.type || anime.status || "Anime";

  container.innerHTML += `
        <a href="detail.html?slug=${slug}" class="block group relative animate-fade-in">
            <div class="relative bg-slate-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-700 aspect-[2/3]">
                
                <div class="absolute top-2 left-2 bg-slate-900 px-2 py-1 text-[10px] font-bold text-white rounded border border-slate-700 shadow-md z-10">
                    ${info}
                </div>

                <img src="${poster}" class="w-full h-full object-cover group-hover:opacity-90 transition" alt="${anime.title}">
                
                <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-10">
                    <h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
                        ${anime.title}
                    </h3>
                </div>
            </div>
        </a>`;
}

// ==========================
// 8. HELPERS
// ==========================
function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.animeList)) return json.animeList;
  return [];
}

function getIconForGenre(name) {
  const n = name.toLowerCase();

  // --- POPULAR / BIG GENRES ---
  if (n.includes("action")) return "⚔️";
  if (n.includes("adventure")) return "🗺️";
  if (n.includes("comedy")) return "🤣";
  if (n.includes("romance")) return "💖";
  if (n.includes("drama")) return "🎭";

  // --- FANTASY & SUPERNATURAL ---
  if (n.includes("isekai")) return "🌀";
  if (n.includes("fantasy")) return "🧚";
  if (n.includes("magic")) return "✨";
  if (n.includes("supernatural")) return "👻";
  if (n.includes("demon")) return "👹";
  if (n.includes("vampire")) return "🧛";
  if (n.includes("super power")) return "⚡";

  // --- SCI-FI & TECH ---
  if (n.includes("sci-fi")) return "🚀";
  if (n.includes("mecha")) return "🤖";
  if (n.includes("space")) return "🌌";
  if (n.includes("cyberpunk")) return "🦾";

  // --- DARK & MYSTERY ---
  if (n.includes("horror")) return "🧟";
  if (n.includes("mystery")) return "🕵️";
  if (n.includes("psychological")) return "🧠";
  if (n.includes("thriller")) return "🔪";
  if (n.includes("gore")) return "🩸";

  // --- LIFE & ACTIVITIES ---
  if (n.includes("slice of life")) return "🍰";
  if (n.includes("school")) return "🏫";
  if (n.includes("sports")) return "⚽";
  if (n.includes("music")) return "🎵";
  if (n.includes("game")) return "🎮";
  if (n.includes("food")) return "🍳";

  // --- DEMOGRAPHICS ---
  if (n.includes("shounen")) return "🔥";
  if (n.includes("shoujo")) return "🎀";
  if (n.includes("seinen")) return "🚬";
  if (n.includes("josei")) return "💄";
  if (n.includes("kids")) return "🎈";

  // --- SPECIFIC THEMES ---
  if (n.includes("harem")) return "👯";
  if (n.includes("ecchi")) return "🍑";
  if (n.includes("martial arts")) return "🥋";
  if (n.includes("samurai")) return "🗡️";
  if (n.includes("historical")) return "🏯";
  if (n.includes("military")) return "🪖";
  if (n.includes("police")) return "🚓";
  if (n.includes("parody")) return "🤡";
  if (n.includes("idols")) return "🎤";

  // Default Icon
  return "📺";
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}
function getCache(key, maxAge = 1000 * 60 * 60 * 24) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.time < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// EXECUTE
loadGenres();
