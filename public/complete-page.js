// ==========================
// SETUP VARIABEL
// ==========================
const completeList = document.getElementById("completeList");
const pagination = document.getElementById("completePagination"); // Ubah nama variabel biar konsisten
const pageTitle = document.getElementById("pageTitle");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// API URL
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

// ✅ FUNGSI LOADING UMUM
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
        <h3 class="text-xl font-bold text-white mb-1 tracking-wide">Memuat Data...</h3>
    </div>
  `;
}

// 1. NAVIGASI MOBILE
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

// ==========================
// 3. LOGIKA PENCARIAN (REUSABLE DESKTOP & MOBILE)
// ==========================

// A. Init Search Function
function initSearch(inputId, dropdownId) {
  const inputEl = document.getElementById(inputId);
  const dropdownEl = document.getElementById(dropdownId);
  let searchTimeout = null;

  if (!inputEl || !dropdownEl) return;

  inputEl.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    // 1. Jika kosong, reset halaman ke Default
    if (query.length === 0) {
      dropdownEl.classList.add("hidden");
      resetPageToDefault();
      return;
    }

    // 2. Tampilkan Dropdown
    dropdownEl.classList.remove("hidden");
    renderLoadingSearch(dropdownEl, query);

    // 3. Fetch Data
    searchTimeout = setTimeout(() => {
      performSearch(query, dropdownEl);
    }, 800);
  });

  // Hide saat klik luar
  document.addEventListener("click", (e) => {
    if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
      dropdownEl.classList.add("hidden");
    }
  });
}

// Aktifkan Search Desktop & Mobile
initSearch("searchInput", "searchResultsDropdown");
initSearch("mobileSearchInput", "mobileSearchResultsDropdown");

// B. Fungsi Reset Halaman
function resetPageToDefault() {
  if (pageTitle)
    // Kembalikan Judul Complete (Hijau)
    pageTitle.innerHTML = `<span class="w-2 h-8 bg-green-500 rounded-full"></span> ✅ Complete Anime`;

  // Munculkan Pagination kembali
  if (pagination) pagination.style.display = "flex";

  // Load ulang halaman 1
  getComplete(1);
}

// C. Render Loading di Dropdown
function renderLoadingSearch(container, query) {
  container.innerHTML = `
        <div class="px-4 py-3 bg-slate-800 border-b border-slate-700">
             <p class="text-xs text-slate-400 truncate">
                Mencari: <span class="text-purple-400 font-bold">"${query}"</span>
             </p>
        </div>
        <div class="pt-4 h-60 flex flex-col items-center justify-center bg-slate-900">
            <div class="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs text-slate-500">Mencari Anime...</p>
        </div>
    `;
}

// D. Fetch Search API
async function performSearch(query, container) {
  if (query.length < 3) return;
  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    // ✅ FILTER: Hanya ambil yang statusnya Completed
    const completedOnly = list.filter(
      (anime) =>
        anime.status && anime.status.toLowerCase().includes("completed"),
    );

    renderDropdownResults(completedOnly, query, container);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="p-4 text-center text-red-400 text-xs">Gagal memuat data.</div>`;
  }
}

// E. Render Hasil Dropdown
function renderDropdownResults(list, query, container) {
  let htmlContent = `
        <div class="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
             <div class="flex-1 min-w-0 pr-2">
                <p class="text-xs text-slate-400 truncate">
                    Hasil: <span class="text-purple-400 font-bold">"${query}"</span>
                </p>
             </div>
             <span class="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">${list.length}</span>
        </div>
        <div style="max-height: 450px; overflow-y: auto;" class="custom-scrollbar bg-slate-900">
    `;

  if (list.length === 0) {
    htmlContent += `
            <div class="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-10">
                <span class="text-2xl mb-2">ternyata kosong 🗿</span>
                <p class="text-xs">Tidak ada anime completed ditemukan.</p>
            </div>
        </div>`;
  } else {
    list.slice(0, 50).forEach((anime) => {
      const slug = anime.animeId || anime.href?.split("/").pop() || "#";
      const poster = anime.poster || "https://via.placeholder.com/100x140";
      const title = anime.title || "No Title";
      const rating = anime.score ? `⭐ ${anime.score}` : "";
      const status = anime.status || "Unknown";

      // Warna badge (Completed Hijau)
      let statusColor = "bg-green-600";
      if (status.toLowerCase().includes("ongoing"))
        statusColor = "bg-purple-600";

      htmlContent += `
                <a href="detail.html?slug=${slug}" class="group flex gap-3 p-3 hover:bg-slate-800 transition-colors border-slate-800/50 w-full relative">
                    <div class="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-slate-800">
                        <img src="${poster}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="${title}">
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 class="text-sm font-bold text-slate-200 truncate group-hover:text-purple-400 transition-colors">${title}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] text-yellow-400 font-bold">${rating}</span>
                            <span class="text-[10px] text-white px-2 ${statusColor} border rounded-full border-slate-700 rounded">${status}</span>
                        </div>
                    </div>
                </a>`;
    });
    htmlContent += `</div>`;
  }

  const containerId = container.id;
  htmlContent += `
        <div class="block text-center py-4 bg-slate-800 hover:bg-purple-600 text-xs font-bold text-slate-400 hover:text-white transition-colors border-t border-slate-700 cursor-pointer" 
             onclick="showPageResults('${query}', '${containerId}')">
            LIHAT SEMUA HASIL
        </div>
    `;

  container.innerHTML = htmlContent;
}

// F. Tampilkan Hasil di Halaman Utama (Grid)
async function showPageResults(query, dropdownIdToClose) {
  // 1. Sembunyikan Dropdown yang aktif
  if (dropdownIdToClose) {
    const el = document.getElementById(dropdownIdToClose);
    if (el) el.classList.add("hidden");
  } else {
    const desktopDropdown = document.getElementById("searchResultsDropdown");
    if (desktopDropdown) desktopDropdown.classList.add("hidden");
  }

  // 2. Update Judul Halaman
  if (pageTitle) {
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Pencarian Completed:</span> "${query}"`;
  }

  // 3. Sembunyikan Pagination
  if (pagination) {
    pagination.style.display = "none";
  }

  // 4. Loading UI
  showLoadingUI(completeList);

  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    // ✅ FILTER: Hanya ambil yang statusnya Completed
    const completedOnly = list.filter(
      (anime) =>
        anime.status && anime.status.toLowerCase().includes("completed"),
    );

    if (completeList) completeList.innerHTML = "";

    if (completedOnly.length > 0) {
      const allCardsHTML = completedOnly
        .map((anime) => generateCardHTML(anime, "complete"))
        .join("");
      completeList.innerHTML = allCardsHTML;
    } else {
      completeList.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10">Tidak ditemukan anime <b>Completed</b> dengan kata kunci "${query}".</div>`;
    }
  } catch (err) {
    console.error(err);
    completeList.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Terjadi kesalahan saat mencari.</div>`;
  }
}

// ==========================
// 4. HELPER & RENDER COMPLETED (DEFAULT)
// ==========================

// Helper HTML Card
function generateCardHTML(anime, type = "ongoing") {
  const slug =
    anime.animeId || (anime.href ? anime.href.split("/").pop() : "#");
  const poster =
    anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  const title = anime.title || "No Title";

  let label = "";
  // Logika Label
  if (
    type === "complete" ||
    (anime.status && anime.status.toLowerCase() === "completed")
  ) {
    label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">⭐ ${anime.score || "-"}</div>`;
  } else if (anime.episodes) {
    label = `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">Ep ${anime.episodes}</div>`;
  } else {
    label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">Completed</div>`;
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

// Helper Extract List
function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (Array.isArray(json.animeList)) return json.animeList;
  if (json.data && Array.isArray(json.data)) return json.data;
  return [];
}

// Fungsi Utama Get Data Halaman
async function getComplete(page = 1) {
  const cacheKey = `complete-page-${page}`;
  const cachedData = getCache(cacheKey);

  const renderList = (dataList) => {
    if (completeList) {
      if (dataList.length > 0) {
        const allCardsHTML = dataList
          .map((anime) => generateCardHTML(anime, "complete"))
          .join("");
        completeList.innerHTML = allCardsHTML;
      } else {
        completeList.innerHTML = `<div class="col-span-full text-center text-red-400 w-full">Data Kosong.</div>`;
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
    showLoadingUI(completeList);
    const res = await fetch(`${COMPLETE_API}?page=${page}`);
    const json = await res.json();
    setCache(cacheKey, json);

    const list = extractAnimeList(json);
    renderList(list);
    renderPaginationUI(page);
  } catch (e) {
    console.error(e);
    if (completeList)
      completeList.innerHTML = `<div class="col-span-full text-center text-red-400 w-full">Gagal memuat data.</div>`;
  }
}

// Render Pagination UI
function renderPaginationUI(page) {
  if (!pagination) return;
  pagination.innerHTML = `
    <button onclick="getComplete(${page - 1})" 
        class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed" 
        ${page <= 1 ? "disabled" : ""}>
        Prev
    </button>
    <span class="px-4 py-2 bg-purple-600 text-white font-bold rounded">
        ${page}
    </span>
    <button onclick="getComplete(${page + 1})" 
        class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition">
        Next
    </button>
  `;
}

// Load data awal
getComplete(1);
