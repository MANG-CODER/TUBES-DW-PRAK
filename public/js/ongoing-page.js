const ongoingList = document.getElementById("ongoingList");
const completeList = document.getElementById("completeList");
const ongoingPagination = document.getElementById("ongoingPagination");
const completePagination = document.getElementById("completePagination");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime/";
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

let ongoingPage = 1;
let completePage = 1;

// ==========================================
// ✅ 1. RENDER CARD
// ==========================================
function renderCard(container, anime, type = "ongoing") {
  // Fallback jika animeId tidak ada, coba ambil dari href atau title
  const slug = anime.animeId || anime.href?.split("/").pop() || "#";
  const poster =
    anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  const title = anime.title || "No Title";
  const episodeCount = anime.episodes || "?";

  const episodeTag =
    type === "ongoing"
      ? `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Ep ${episodeCount}</div>`
      : `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Complete</div>`;

  container.innerHTML += `
    <a href="detail.html?slug=${slug}" class="block group">
      <div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-800">
        ${episodeTag}
        <img src="${poster}" alt="${title}" class="w-full h-64 object-cover">
        <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
          <h3 class="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
            ${title}
          </h3>
          <p class="text-[10px] text-gray-400 mt-1">
             ${anime.releaseDay || ""} ${
    anime.latestReleaseDate ? "• " + anime.latestReleaseDate : ""
  }
          </p>
        </div>
      </div>
    </a>
  `;
}

// ==========================================
// ✅ 2. PAGINATION
// ==========================================
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

// ==========================================
// ✅ 3. HELPER (CACHE & DATA EXTRACTOR)
// ==========================================
function setCache(key, data) {
  try {
    const cache = { timestamp: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (e) {
    console.warn("Storage Full/Error", e);
  }
}

function getCache(key, maxAge = 1000 * 60 * 15) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > maxAge) return null;
    return parsed.data;
  } catch (e) {
    return null;
  }
}

// FUNGSI PENTING: MENCARI ARRAY DI DALAM JSON API
function extractAnimeList(json) {
  if (!json) return [];

  // Cek Prioritas 1: json.data.animeList (Sesuai JSON contoh kamu)
  if (json.data && Array.isArray(json.data.animeList)) {
    return json.data.animeList;
  }
  // Cek Prioritas 2: json.animeList (Siapa tau strukturnya langsung)
  if (Array.isArray(json.animeList)) {
    return json.animeList;
  }
  // Cek Prioritas 3: json.data (Siapa tau data langsung array)
  if (Array.isArray(json.data)) {
    return json.data;
  }
  // Cek Prioritas 4: json itu sendiri adalah array
  if (Array.isArray(json)) {
    return json;
  }

  return []; // Gagal menemukan array
}

// ==========================================
// ✅ 4. FETCH ONGOING
// ==========================================
async function getOngoing(page = 1) {
  ongoingPage = page;
  if (ongoingList)
    ongoingList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Loading Ongoing...</div>`;

  const cacheKey = `ongoing-page-${page}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    const list = extractAnimeList(cachedData);
    if (ongoingList) ongoingList.innerHTML = "";
    list.forEach((anime) => renderCard(ongoingList, anime, "ongoing"));
    renderPagination(ongoingPagination, ongoingPage, "getOngoing");
    return;
  }

  try {
    const res = await fetch(`${ONGOING_API}?page=${page}`);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const json = await res.json();

    // DEBUG: LIHAT ISI API DI CONSOLE BROWSER (Tekan F12 > Console)
    console.log("DEBUG ONGOING:", json);

    const list = extractAnimeList(json);

    if (list.length > 0) {
      setCache(cacheKey, json);
      if (ongoingList) ongoingList.innerHTML = "";
      list.forEach((anime) => renderCard(ongoingList, anime, "ongoing"));
      renderPagination(ongoingPagination, ongoingPage, "getOngoing");
    } else {
      if (ongoingList)
        ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400">Data Kosong / Struktur API Berbeda. Cek Console.</div>`;
    }
  } catch (err) {
    console.error(err);
    if (ongoingList)
      ongoingList.innerHTML = `<div class="col-span-full text-center text-red-500">Gagal memuat API: ${err.message}</div>`;
  }
}

// ==========================================
// ✅ 5. FETCH COMPLETE
// ==========================================
async function getComplete(page = 1) {
  completePage = page;
  if (completeList)
    completeList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Loading Complete...</div>`;

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
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const json = await res.json();
    console.log("DEBUG COMPLETE:", json);

    const list = extractAnimeList(json);

    if (list.length > 0) {
      setCache(cacheKey, json);
      if (completeList) completeList.innerHTML = "";
      list.forEach((anime) => renderCard(completeList, anime, "complete"));
      renderPagination(completePagination, completePage, "getComplete");
    } else {
      if (completeList)
        completeList.innerHTML = `<div class="col-span-full text-center text-red-400">Data Kosong.</div>`;
    }
  } catch (err) {
    console.error(err);
    if (completeList)
      completeList.innerHTML = `<div class="col-span-full text-center text-red-500">Gagal memuat API.</div>`;
  }
}

// ==========================================
// ✅ 6. SEARCH
// ==========================================
if (searchInput) {
  searchInput.addEventListener("keyup", async function () {
    const q = this.value.trim();

    if (q.length < 3) {
      if (pageTitle) pageTitle.hidden = false;
      getOngoing(1);
      getComplete(1);
      return;
    }

    if (pageTitle) pageTitle.hidden = true;

    const cacheKey = `search-${q}`;
    const cachedData = getCache(cacheKey, 1000 * 60 * 5);

    if (cachedData) {
      const list = extractAnimeList(cachedData);
      displaySearchResults(list);
      return;
    }

    try {
      if (ongoingList)
        ongoingList.innerHTML = `<div class="col-span-full text-center text-white">Searching...</div>`;
      if (completeList) completeList.innerHTML = "";

      const res = await fetch(`${SEARCH_API}${q}`);
      const json = await res.json();

      const list = extractAnimeList(json);
      setCache(cacheKey, json);
      displaySearchResults(list);
    } catch (err) {
      console.error(err);
      if (ongoingList)
        ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400">Search Error</div>`;
    }
  });
}

function displaySearchResults(list) {
  if (ongoingList) ongoingList.innerHTML = "";
  if (completeList) completeList.innerHTML = "";
  if (ongoingPagination) ongoingPagination.innerHTML = "";
  if (completePagination) completePagination.innerHTML = "";

  if (list && list.length > 0) {
    list.forEach((anime) => renderCard(ongoingList, anime, "search"));
  } else {
    if (ongoingList)
      ongoingList.innerHTML =
        "<p class='col-span-full text-center text-white'>Tidak ditemukan.</p>";
  }
}

// ==========================================
// ✅ 7. INIT & CLEAR OLD CACHE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // Bersihkan cache lama agar error tidak tersimpan
  // localStorage.clear(); // Uncomment baris ini SEKALI saja jika masih error, lalu comment lagi.

  getOngoing();
  getComplete();
});
