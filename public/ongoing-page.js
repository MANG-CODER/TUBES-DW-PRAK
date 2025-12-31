// ==========================
// SETUP VARIABEL
// ==========================
const ongoingList = document.getElementById("ongoingList");
const pageTitle = document.getElementById("pageTitle");
const pagination = document.getElementById("ongoingPagination");

const searchInput = document.getElementById("searchInput");
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime/";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

// ✅ FUNGSI LOADING
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
        <h3 class="text-xl font-bold text-white mb-1 tracking-wide">Memuat Ongoing...</h3>
    </div>
  `;
}

// 1. NAVIGASI
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 2. CACHE SYSTEM
// ==========================
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) {}
}

function getCache(key, maxAge = 1000 * 60 * 15) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.timestamp < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// 3. SEARCH
async function handleLiveSearch(query) {
  const cleanQuery = query.trim();

  if (cleanQuery.length < 3) {
    if (pageTitle) pageTitle.innerText = "🔥 Semua Ongoing Anime";
    if (pagination) pagination.style.display = "flex";
    getOngoing(1);
    return;
  }

  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil:</span> "${cleanQuery}"`;
  if (pagination) pagination.style.display = "none";

  const cacheKey = `search-${cleanQuery}`;
  const cachedData = getCache(cacheKey, 1000 * 60 * 5);
  if (cachedData) {
    renderSearchResults(cachedData);
    return;
  }

  showLoadingUI(ongoingList);

  try {
    const res = await fetch(`${SEARCH_API}${cleanQuery}`);
    const json = await res.json();
    setCache(cacheKey, json);
    renderSearchResults(json);
  } catch (e) {
    console.error(e);
    ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400">Error search.</div>`;
  }
}

function renderSearchResults(json) {
  const list = extractAnimeList(json);
  if (ongoingList) ongoingList.innerHTML = "";
  if (list.length > 0) {
    list.forEach((anime) => renderCard(ongoingList, anime, "search"));
  } else {
    ongoingList.innerHTML = `<div class="col-span-full text-center text-slate-400">Tidak ditemukan.</div>`;
  }
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

// 4. HELPER & RENDER (DISESUAIKAN DENGAN HOME)
function generateCardHTML(anime, type = "ongoing") {
  const slug =
    anime.animeId || (anime.href ? anime.href.split("/").pop() : "#");
  const poster =
    anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  const title = anime.title || "No Title";

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

  return `
    <a href="detail.html?slug=${slug}" class="block group w-full h-full">
      <div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-800 flex flex-col h-full">
        ${label}
        
        <div class="relative w-full overflow-hidden" style="padding-top: 140%;">
            <img src="${poster}" alt="${title}" class="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
        </div>
        
        <div class="flex-1 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-4 flex flex-col justify-end">
          <h3 class="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">${title}</h3>
          <p class="text-[10px] text-gray-400 mt-1">${dateInfo}</p>
        </div>
      </div>
    </a>
  `;
}

function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (Array.isArray(json.animeList)) return json.animeList;
  if (json.data && Array.isArray(json.data)) return json.data;
  return [];
}

async function getOngoing(page = 1) {
  const cacheKey = `ongoing-page-${page}`;
  const cachedData = getCache(cacheKey);

  // Helper render
  const renderList = (dataList) => {
    if (ongoingList) {
      if (dataList.length > 0) {
        // PANGGIL FUNGSI generateCardHTML YANG BARU DI ATAS
        const allCardsHTML = dataList
          .map((anime) => generateCardHTML(anime, "ongoing"))
          .join("");
        ongoingList.innerHTML = allCardsHTML;
      } else {
        ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400 w-full">Data Kosong.</div>`;
      }
    }
  };

  if (cachedData) {
    const list = extractAnimeList(cachedData);
    renderList(list);
    renderPaginationUI(page);
    return;
  }

  try {
    showLoadingUI(ongoingList);
    const res = await fetch(`${ONGOING_API}?page=${page}`);
    const json = await res.json();
    setCache(cacheKey, json);

    const list = extractAnimeList(json);
    renderList(list);
    renderPaginationUI(page);
  } catch (e) {
    console.error(e);
    if (ongoingList)
      ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400 w-full">Gagal memuat data.</div>`;
  }
}

function renderPaginationUI(page) {
  if (!pagination) return;
  pagination.innerHTML = `
    <button onclick="getOngoing(${page - 1})" 
        class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed" 
        ${page <= 1 ? "disabled" : ""}>
        Prev
    </button>
    <span class="px-4 py-2 bg-purple-600 text-white font-bold rounded">
        ${page}
    </span>
    <button onclick="getOngoing(${page + 1})" 
        class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition">
        Next
    </button>
  `;
}

getOngoing(1);