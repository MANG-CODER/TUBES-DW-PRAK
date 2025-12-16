// ==========================
// 1. SETUP VARIABEL
// ==========================
const completeList = document.getElementById("completeList");
const completePagination = document.getElementById("completePagination");
const pageTitle = document.getElementById("pageTitle");

// Search Elements (Desktop & Mobile)
const searchInput = document.getElementById("searchInput");
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");

// Navbar Elements
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// API URL
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

let completePage = 1;

// ==========================
// 2. NAVIGASI (MENU SANDWICH)
// ==========================
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 3. LOGIKA PENCARIAN (LIVE SEARCH)
// ==========================

// Fungsi pencarian utama (bisa dipanggil desktop & mobile)
async function handleLiveSearch(query) {
    const cleanQuery = query.trim();

    // A. KEMBALI KE DEFAULT (Jika input dihapus / < 3 huruf)
    if (cleanQuery.length < 3) {
        if (pageTitle) pageTitle.innerText = "✅ Semua Completed Anime";
        if (pageTitle) pageTitle.hidden = false;
        if (completePagination) completePagination.style.display = "flex"; 
        getComplete(1); // Load ulang halaman 1 complete
        return;
    }

    // B. MODE SEARCH
    if (pageTitle) pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil:</span> "${cleanQuery}"`;
    // Sembunyikan pagination saat search
    if (completePagination) completePagination.style.display = "none"; 

    // Cek Cache
    const cacheKey = `search-${cleanQuery}`;
    const cachedData = getCache(cacheKey, 1000 * 60 * 5);
    if (cachedData) {
        const list = extractAnimeList(cachedData);
        displaySearchResults(list);
        return;
    }

    // Fetch API
    if (completeList) completeList.innerHTML = `<div class="col-span-full text-center text-white animate-pulse">Mencari...</div>`;

    try {
        const res = await fetch(`${SEARCH_API}${cleanQuery}`);
        const json = await res.json();
        
        setCache(cacheKey, json);
        const list = extractAnimeList(json);
        displaySearchResults(list);

    } catch (err) {
        console.error(err);
        if (completeList) completeList.innerHTML = `<div class="col-span-full text-center text-red-400">Error search.</div>`;
    }
}

function displaySearchResults(list) {
    if (completeList) completeList.innerHTML = "";
    
    if (list && list.length > 0) {
        // Gunakan type="search" agar badge menyesuaikan konten (Score/Episode)
        list.forEach(anime => renderCard(completeList, anime, "search"));
    } else {
        completeList.innerHTML = `<div class="col-span-full text-center text-slate-400">Tidak ditemukan.</div>`;
    }
}

// --- Event Listener Desktop ---
if (searchInput) {
    searchInput.addEventListener("keyup", function() {
        handleLiveSearch(this.value);
    });
}

// --- Event Listener Mobile ---
if (mobileSearchForm && mobileSearchInput) {
    mobileSearchForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Mencegah reload halaman
        mobileSearchInput.blur(); // Tutup keyboard
        handleLiveSearch(mobileSearchInput.value);
    });
}

// ==========================
// 4. HELPER & RENDER (SMART BADGE)
// ==========================

function extractAnimeList(json) {
    if (!json) return [];
    if (json.data && Array.isArray(json.data.animeList)) return json.data.animeList;
    if (Array.isArray(json.animeList)) return json.animeList;
    if (json.data && Array.isArray(json.data)) return json.data;
    if (Array.isArray(json)) return json;
    return [];
}

function renderCard(container, anime, type = "complete") {
  const slug = anime.animeId || anime.href?.split("/").pop() || "#";
  const poster = anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  const title = anime.title || "No Title";

  // --- LOGIKA BADGE CERDAS ---
  let label = "";
  const episodeCount = anime.episodes || anime.episode; 
  const scoreCount = anime.score;
  const isComplete = type === "complete" || anime.status === "Completed";

  if (isComplete) {
      // Prioritas Score untuk Anime Complete
      label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${scoreCount || "-"}</div>`;
  } 
  else if (episodeCount) {
      // Jika hasil search ternyata ongoing, tampilkan Episode
      label = `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Ep ${episodeCount}</div>`;
  } 
  else if (scoreCount) {
      // Fallback ke Score
      label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${scoreCount}</div>`;
  } 
  else {
      label = `<div class="absolute top-2 left-2 bg-gray-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Anime</div>`;
  }

  // Tanggal Info
  const dateInfo = anime.lastReleaseDate
    ? `Selesai: ${anime.lastReleaseDate}`
    : anime.releaseDay || "";

  container.innerHTML += `
    <a href="detail.html?slug=${slug}" class="block group">
      <div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-800">
        ${label}
        <img src="${poster}" alt="${title}" class="w-full h-64 object-cover">
        <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
          <h3 class="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
            ${title}
          </h3>
          <p class="text-[10px] text-gray-400 mt-1">
             ${dateInfo}
          </p>
        </div>
      </div>
    </a>
  `;
}

function renderPagination(container, currentPage, callbackName) {
  if (!container) return;
  container.innerHTML = `
    <button onclick="${callbackName}(${currentPage - 1})"
      class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      ${currentPage === 1 ? "disabled" : ""}>
      Prev
    </button>
    <span class="px-4 py-2 bg-purple-600 text-white font-bold rounded">${currentPage}</span>
    <button onclick="${callbackName}(${currentPage + 1})"
      class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition">
      Next
    </button>
  `;
}

// ==========================
// 5. CACHE SYSTEM
// ==========================
function setCache(key, data) {
  try {
    const cache = { timestamp: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (e) { console.warn("Cache Full"); }
}

function getCache(key, maxAge = 1000 * 60 * 25) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > maxAge) return null;
    return parsed.data;
  } catch (e) { return null; }
}

// ==========================
// 6. FETCH COMPLETE (DEFAULT LOAD)
// ==========================
async function getComplete(page = 1) {
  completePage = page;
  if (completeList) completeList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Loading Complete Anime...</div>`;

  const cacheKey = `complete-page-${page}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    const list = extractAnimeList(cachedData);
    if (completeList) completeList.innerHTML = "";
    list.forEach((anime) => renderCard(completeList, anime, "complete"));
    renderPagination(completePagination, completePage, "getComplete");
    return;
  }

  try {
    const res = await fetch(`${COMPLETE_API}?page=${page}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    if (list.length > 0) {
      setCache(cacheKey, json);
      if (completeList) completeList.innerHTML = "";
      list.forEach((anime) => renderCard(completeList, anime, "complete"));
      renderPagination(completePagination, completePage, "getComplete");
    } else {
      if (completeList) completeList.innerHTML = `<div class="col-span-full text-center text-red-400">Data Kosong</div>`;
    }
  } catch (err) {
    console.error(err);
    if (completeList) completeList.innerHTML = `<div class="col-span-full text-center text-red-500">Gagal memuat API</div>`;
  }
}

// Load Awal
document.addEventListener("DOMContentLoaded", () => {
  getComplete();
});