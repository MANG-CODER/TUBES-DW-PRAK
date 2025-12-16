const ongoingList = document.getElementById("ongoingList"); // Bisa jadi null di page ini
const completeList = document.getElementById("completeList");
const ongoingPagination = document.getElementById("ongoingPagination"); // Bisa jadi null
const completePagination = document.getElementById("completePagination");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime/";
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

let ongoingPage = 1;
let completePage = 1;

// ==========================================
// ✅ 1. RENDER CARD (Mode Complete)
// ==========================================
function renderCard(container, anime, type = "complete") {
  // Ambil ID dari animeId
  const slug = anime.animeId || anime.href?.split("/").pop() || "#";
  const poster =
    anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  const title = anime.title || "No Title";

  // Tampilkan Score jika Complete, Tampilkan Episode jika Ongoing/Search
  const label =
    type === "complete"
      ? `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${
          anime.score || "-"
        }</div>`
      : `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Ep ${
          anime.episodes || "?"
        }</div>`;

  // Tanggal rilis (Complete biasanya pakai lastReleaseDate)
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
// ✅ 3. HELPER (CACHE & SAFETY EXTRACTOR)
// ==========================================
function setCache(key, data) {
  try {
    const cache = { timestamp: Date.now(), data };
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (e) {
    console.warn("Cache Full");
  }
}

function getCache(key, maxAge = 1000 * 60 * 25) {
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

// FUNGSI PENTING: Mencegah error "undefined reading animeList"
function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList; // Sesuai JSON baru
  if (Array.isArray(json.animeList)) return json.animeList;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json)) return json;
  return [];
}

// ==========================================
// ✅ 4. FETCH COMPLETE
// ==========================================
async function getComplete(page = 1) {
  completePage = page;

  // Reset UI Loading
  if (completeList)
    completeList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Loading Complete Anime...</div>`;

  const cacheKey = `complete-page-${page}`;
  const cachedData = getCache(cacheKey);

  // --- CEK CACHE ---
  if (cachedData) {
    const list = extractAnimeList(cachedData);
    if (completeList) completeList.innerHTML = "";
    list.forEach((anime) => renderCard(completeList, anime, "complete"));
    renderPagination(completePagination, completePage, "getComplete");
    return;
  }

  // --- FETCH API ---
  try {
    const res = await fetch(`${COMPLETE_API}?page=${page}`);
    if (!res.ok) throw new Error("API Error");

    const json = await res.json();
    console.log("DEBUG COMPLETE:", json); // Cek console untuk memastikan data masuk

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

// ==========================================
// ✅ 5. SEARCH FUNCTION (Fitur Pencarian)
// ==========================================
if (searchInput) {
  searchInput.addEventListener("keyup", async function () {
    const q = this.value.trim();

    // 1. Jika input < 3 huruf, kembalikan ke tampilan awal
    if (q.length < 3) {
      if (pageTitle) pageTitle.hidden = false;
      getComplete(1); // Load ulang halaman 1
      return;
    }

    // 2. Sembunyikan judul halaman saat mencari
    if (pageTitle) pageTitle.hidden = true;

    const cacheKey = `search-${q}`;
    const cachedData = getCache(cacheKey, 1000 * 60 * 5);

    // Cek Cache Search
    if (cachedData) {
      const list = extractAnimeList(cachedData);
      displaySearchResults(list);
      return;
    }

    // Fetch Search API
    try {
      if (completeList)
        completeList.innerHTML = `<div class="col-span-full text-center text-white">Searching...</div>`;
      if (completePagination) completePagination.innerHTML = "";

      const res = await fetch(`${SEARCH_API}${q}`);
      const json = await res.json();

      setCache(cacheKey, json);
      const list = extractAnimeList(json);

      displaySearchResults(list);
    } catch (err) {
      console.error(err);
      if (completeList)
        completeList.innerHTML =
          "<p class='col-span-full text-center text-red-400'>Terjadi kesalahan saat mencari.</p>";
    }
  });
}

function displaySearchResults(list) {
  if (completeList) completeList.innerHTML = "";
  if (completePagination) completePagination.innerHTML = "";

  if (list && list.length > 0) {
    // Tipe 'search' akan menampilkan badge episode jika tersedia
    list.forEach((anime) => renderCard(completeList, anime, "complete"));
  } else {
    if (completeList)
      completeList.innerHTML =
        "<p class='col-span-full text-center text-white'>Tidak ditemukan anime dengan kata kunci tersebut.</p>";
  }
}

// ==========================================
// ✅ 6. LOAD AWAL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  getComplete();
});

// ==========================
// 7. Menu
// ==========================
// Ambil elemen button dan menu
const mobileBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

// Tambahkan event listener untuk klik
mobileBtn.addEventListener('click', () => {
    // Toggle class 'hidden' pada menu mobile
    mobileMenu.classList.toggle('hidden');
});