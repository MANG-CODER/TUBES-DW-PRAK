// ==========================
// SETUP VARIABEL
// ==========================
const completeList = document.getElementById("completeList");
const completePagination = document.getElementById("completePagination");
const pageTitle = document.getElementById("pageTitle");

const searchInput = document.getElementById("searchInput");
const searchDropdown = document.getElementById("searchResultsDropdown");

const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";
let completePage = 1;

// FUNGSI LOADING
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

// 1. NAVIGASI MOBILE
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 2. CACHE HELPER
// ==========================
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

// ==========================
// 3. LOGIKA PENCARIAN
// ==========================
let searchTimeout = null;

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    // 1. Reset jika kosong
    if (query.length === 0) {
      if (searchDropdown) searchDropdown.classList.add("hidden");
      resetPageToDefault();
      return;
    }

    // 2. Tampilkan Dropdown Loading
    if (searchDropdown) {
      searchDropdown.classList.remove("hidden");
      renderLoadingSearch(query);
    }

    // 3. Debounce
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 800);
  });

  // Hide saat klik luar
  document.addEventListener("click", (e) => {
    if (
      searchDropdown &&
      !searchInput.contains(e.target) &&
      !searchDropdown.contains(e.target)
    ) {
      searchDropdown.classList.add("hidden");
    }
  });
}

// Helper: Reset Halaman ke Default
function resetPageToDefault() {
  if (pageTitle)
    pageTitle.innerHTML = `<span class="w-2 h-8 bg-green-500 rounded-full"></span> ✅ Complete Anime`;

  // Tampilkan kembali pagination
  if (completePagination) completePagination.style.display = "flex";

  getComplete(1); // Load ulang default
}

// A. UI LOADING DROPDOWN
function renderLoadingSearch(query) {
  if (!searchDropdown) return;
  searchDropdown.innerHTML = `
        <div class="px-4 py-3 bg-slate-800 border-b border-slate-700">
             <p class="text-xs text-slate-400 truncate">
                Mencari: <span class="text-purple-400 font-bold">"${query}"</span>
             </p>
        </div>
        
        <div class="pt-4 h-60 flex flex-col items-center justify-center bg-slate-900">
            <div class="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs text-slate-500">Mencari Anime...</p>
        </div>

        <div class="bg-slate-800 border-t border-slate-700 p-2">
            <div class="h-4 w-24 bg-slate-700 rounded mx-auto animate-pulse"></div>
        </div>
    `;
}

// B. FUNGSI FETCH
async function performSearch(query) {
  if (query.length < 3) return;

  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    // Filter hanya status Completed
    const completedOnly = list.filter(
      (anime) =>
        anime.status && anime.status.toLowerCase().includes("completed"),
    );

    renderDropdownResults(completedOnly, query);
  } catch (err) {
    console.error(err);
    if (searchDropdown)
      searchDropdown.innerHTML = `<div class="p-4 text-center text-red-400 text-xs">Gagal memuat data.</div>`;
  }
}

// C. UI HASIL DROPDOWN
function renderDropdownResults(list, query) {
  if (!searchDropdown) return;

  // HEADER
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
    // LIST ITEM
    list.slice(0, 30).forEach((anime) => {
      const slug = anime.animeId || anime.href?.split("/").pop() || "#";
      const poster = anime.poster || "https://via.placeholder.com/100x140";
      const title = anime.title || "No Title";
      const rating = anime.score ? `⭐ ${anime.score}` : "";
      const status = anime.status || "Completed";

      htmlContent += `
                <a href="detail.html?slug=${slug}" class="group flex gap-3 p-3 hover:bg-slate-800 transition-colors border-slate-800/50 w-full relative">
                    
                    <div class="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-slate-800">
                        <img src="${poster}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="${title}">
                    </div>
                    
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 class="text-sm font-bold text-slate-200 truncate group-hover:text-purple-400 transition-colors">
                            ${title}
                        </h4>
                        
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] text-yellow-400 font-bold">${rating}</span>
                            <span class="text-[10px] text-white px-2 bg-green-600 border rounded-full border-slate-700 rounded">${status}</span>
                        </div>
                    </div>
                </a>
            `;
    });
    htmlContent += `</div>`; // Tutup div Body
  }

  // FOOTER (Klik memanggil fungsi showPageResults)
  htmlContent += `
        <div class="block text-center py-4 bg-slate-800 hover:bg-purple-600 text-xs font-bold text-slate-400 hover:text-white transition-colors border-t border-slate-700 cursor-pointer" onclick="showPageResults('${query}')">
            LIHAT SEMUA HASIL
        </div>
    `;

  searchDropdown.innerHTML = htmlContent;
}

// D. FUNGSI RENDER KE HALAMAN UTAMA
async function showPageResults(query) {
  // 1. Sembunyikan Dropdown
  if (searchDropdown) searchDropdown.classList.add("hidden");

  // 2. Ubah Judul Halaman
  if (pageTitle) {
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Pencarian Completed:</span> "${query}"`;
  }

  // 3. Sembunyikan Pagination
  if (completePagination) {
    completePagination.style.display = "none";
  }

  // 4. Loading Grid Utama
  showLoadingUI(completeList);

  // 5. Fetch Ulang
  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    // Filter Completed Only
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
      completeList.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10">Tidak ditemukan anime completed dengan kata kunci "${query}".</div>`;
    }
  } catch (err) {
    console.error(err);
    if (completeList)
      completeList.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Terjadi kesalahan saat mencari.</div>`;
  }
}

// ==========================
// 4. HELPER & CARD GENERATOR
// ==========================
function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (Array.isArray(json.animeList)) return json.animeList;
  if (json.data && Array.isArray(json.data)) return json.data;
  return [];
}

function generateCardHTML(anime, type = "ongoing") {
  const slug =
    anime.animeId || (anime.href ? anime.href.split("/").pop() : "#");
  const poster =
    anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  const title = anime.title || "No Title";

  let label = "";
  // Logic Label: Kalau status Completed, pakai warna hijau
  if (
    type === "complete" ||
    (anime.status && anime.status.toLowerCase() === "completed")
  ) {
    label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">⭐ ${
      anime.score || "-"
    }</div>`;
  } else if (anime.episodes) {
    label = `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">Ep ${anime.episodes}</div>`;
  } else {
    label = `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md z-10">Completed</div>`;
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

function renderPaginationUI(container, currentPage, callbackName) {
  if (!container) return;
  container.innerHTML = `
    <button onclick="${callbackName}(${currentPage - 1})" 
        class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed" 
        ${currentPage === 1 ? "disabled" : ""}>
        Prev
    </button>
    <span class="px-4 py-2 bg-purple-600 text-white font-bold rounded">
        ${currentPage}
    </span>
    <button onclick="${callbackName}(${currentPage + 1})" 
        class="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition">
        Next
    </button>
  `;
}

// ==========================
// MAIN LOGIC
// ==========================
async function getComplete(page = 1) {
  completePage = page;
  const cacheKey = `complete-page-${page}`;
  const cachedData = getCache(cacheKey);

  const renderList = (list) => {
    if (completeList) {
      if (list.length > 0) {
        const html = list
          .map((anime) => generateCardHTML(anime, "complete"))
          .join("");
        completeList.innerHTML = html;
        renderPaginationUI(completePagination, completePage, "getComplete");
      } else {
        completeList.innerHTML = `<div class="col-span-full text-center text-red-400">Data Kosong</div>`;
      }
    }
  };

  if (cachedData) {
    renderList(extractAnimeList(cachedData));
    return;
  }

  showLoadingUI(completeList);

  try {
    const res = await fetch(`${COMPLETE_API}?page=${page}`);
    const json = await res.json();
    setCache(cacheKey, json);
    renderList(extractAnimeList(json));
  } catch (err) {
    console.error(err);
    if (completeList)
      completeList.innerHTML = `<div class="col-span-full text-center text-red-500">Gagal memuat API</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  getComplete();
});
