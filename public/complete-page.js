const completeList = document.getElementById("completeList");
const completePagination = document.getElementById("completePagination");
const pageTitle = document.getElementById("pageTitle");
const searchInput = document.getElementById("searchInput");
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";
let completePage = 1;

function showLoadingUI(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 min-h-[300px]">
        <div class="relative flex items-center justify-center w-20 h-20 mb-4">
             <div class="absolute inset-0 rounded-full border-[5px] border-slate-800 border-t-purple-500 animate-spin"></div>
             <div class="absolute inset-2 rounded-full border-4 border-slate-800 opacity-50"></div>
             <div class="relative bg-slate-900 rounded-full p-3 shadow-2xl shadow-purple-500/20">
                 <img src="./img/Icon MangNime.png" class="w-8 h-8 object-contain animate-pulse" alt="Loading">
             </div>
        </div>
        <h3 class="text-xl font-bold text-white mb-1 tracking-wide">Memuat Completed...</h3>
    </div>
  `;
}

if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// CACHE HELPER
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) {}
}
function getCache(key, maxAge = 1000 * 60 * 25) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.timestamp < maxAge) return c.data;
  } catch (e) {}
  return null;
}

async function handleLiveSearch(query) {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 3) {
    if (pageTitle) pageTitle.innerText = "✅ Semua Completed Anime";
    if (completePagination) completePagination.style.display = "flex";
    getComplete(1);
    return;
  }
  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil:</span> "${cleanQuery}"`;
  if (completePagination) completePagination.style.display = "none";

  // Search Cache
  const cacheKey = `search-${cleanQuery}`;
  const cachedData = getCache(cacheKey, 1000 * 60 * 5); // 5 menit cache search
  if (cachedData) {
    displaySearchResults(extractAnimeList(cachedData));
    return;
  }

  showLoadingUI(completeList);
  try {
    const res = await fetch(`${SEARCH_API}${cleanQuery}`);
    const json = await res.json();
    setCache(cacheKey, json);
    displaySearchResults(extractAnimeList(json));
  } catch (err) {
    console.error(err);
    if (completeList)
      completeList.innerHTML = `<div class="col-span-full text-center text-red-400">Error search.</div>`;
  }
}

function displaySearchResults(list) {
  if (completeList) completeList.innerHTML = "";
  if (list && list.length > 0)
    list.forEach((anime) => renderCard(completeList, anime, "search"));
  else
    completeList.innerHTML = `<div class="col-span-full text-center text-slate-400">Tidak ditemukan.</div>`;
}

if (searchInput)
  searchInput.addEventListener("keyup", (e) =>
    handleLiveSearch(e.target.value)
  );
if (mobileSearchForm) {
  mobileSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    mobileSearchInput.blur();
    handleLiveSearch(mobileSearchInput.value);
  });
}

function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (Array.isArray(json.animeList)) return json.animeList;
  if (json.data && Array.isArray(json.data)) return json.data;
  return [];
}

function renderCard(container, anime, type = "ongoing") {
  const slug = anime.animeId || anime.href?.split("/").pop() || "#";
  const poster =
    anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  const title = anime.title || "No Title";

  // Label Logic (Sama seperti di Home)
  let label = "";
  if (type === "complete" || anime.status === "Completed") {
    label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">⭐ ${
      anime.score || "-"
    }</div>`;
  } else if (anime.episodes) {
    label = `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">Ep ${anime.episodes}</div>`;
  } else {
    label = `<div class="absolute top-2 left-2 bg-gray-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">Anime</div>`;
  }

  const dateInfo = anime.lastReleaseDate
    ? `Selesai: ${anime.lastReleaseDate}`
    : anime.releaseDay || "";

  // Render HTML (Sama persis dengan app.js)
  container.innerHTML += `
    <a href="detail.html?slug=${slug}" class="block group">
      <div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-800">
        ${label}
        <img src="${poster}" alt="${title}" class="w-full h-64 object-cover">
        
        <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
          <h3 class="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">${title}</h3>
          <p class="text-[10px] text-gray-400 mt-1">${dateInfo}</p>
        </div>
      </div>
    </a>
  `;
}
function renderPagination(container, currentPage, callbackName) {
  if (!container) return;
  container.innerHTML = `<button onclick="${callbackName}(${
    currentPage - 1
  })" class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed" ${
    currentPage === 1 ? "disabled" : ""
  }>Prev</button><span class="px-4 py-2 bg-purple-600 text-white font-bold rounded">${currentPage}</span><button onclick="${callbackName}(${
    currentPage + 1
  })" class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition">Next</button>`;
}

async function getComplete(page = 1) {
  completePage = page;
  const cacheKey = `complete-page-${page}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    const list = extractAnimeList(cachedData);
    if (completeList) completeList.innerHTML = "";
    list.forEach((anime) => renderCard(completeList, anime, "complete"));
    renderPagination(completePagination, completePage, "getComplete");
    return;
  }

  showLoadingUI(completeList);

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
      if (completeList)
        completeList.innerHTML = `<div class="col-span-full text-center text-red-400">Data Kosong</div>`;
    }
  } catch (err) {
    console.error(err);
    if (completeList)
      completeList.innerHTML = `<div class="col-span-full text-center text-red-500">Gagal memuat API</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getComplete();
});
