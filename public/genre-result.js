// ==========================================
// 1. INISIALISASI
// ==========================================
const params = new URLSearchParams(window.location.search);
const genreId = params.get("id"); // ID Genre (misal: 'action')
const currentPageParam = params.get("page") || 1; // Halaman saat ini

const GENRE_API_BASE = "https://www.sankavollerei.com/anime/genre/";

// DOM Elements
const pageTitle = document.getElementById("pageTitle");
const genreBadge = document.getElementById("genreBadge");
const animeList = document.getElementById("animeList");
const paginationContainer = document.getElementById("pagination");

// ==========================================
// 2. SISTEM CACHE
// ==========================================
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}

function getCache(key, maxAge = 1000 * 60 * 15) {
  // Cache 15 Menit
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.time < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// ==========================================
// 3. FETCH DATA
// ==========================================
async function loadGenreAnime(page = 1) {
  if (!genreId) {
    showError("Genre tidak ditemukan.");
    return;
  }

  // Update UI Header
  const formattedTitle = genreId.replace(/-/g, " ").toUpperCase();
  pageTitle.textContent = `Genre: ${formattedTitle}`;
  genreBadge.textContent = `Genre: ${formattedTitle}`;

  // Cek Cache
  const cacheKey = `genre-${genreId}-page-${page}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    renderAnimeList(cachedData.animeList);
    renderPagination(cachedData.pagination, page);
    return;
  }

  // Fetch API
  try {
    const res = await fetch(`${GENRE_API_BASE}${genreId}?page=${page}`);
    const json = await res.json();

    // Validasi Data
    if (json.status === "success" && json.data) {
      // Gabungkan list & pagination untuk disimpan di cache
      const dataToCache = {
        animeList: json.data.animeList,
        pagination: json.pagination,
      };

      setCache(cacheKey, dataToCache);
      renderAnimeList(dataToCache.animeList);
      renderPagination(dataToCache.pagination, page);
    } else {
      showError("Tidak ada anime ditemukan untuk genre ini.");
    }
  } catch (e) {
    console.error(e);
    showError("Terjadi kesalahan koneksi.");
  }
}

// ==========================================
// 4. RENDER ANIME LIST
// ==========================================
function renderAnimeList(list) {
  animeList.innerHTML = "";

  if (!list || list.length === 0) {
    showError("Tidak ada data anime.");
    return;
  }

  list.forEach((anime) => {
    // Ambil ID Anime dengan aman
    const slug = anime.animeId || anime.href.split("/").pop();
    const poster = anime.poster || "https://via.placeholder.com/300x450";
    const info = anime.score ? `⭐ ${anime.score}` : anime.season || "Unknown";

    animeList.innerHTML += `
            <a href="detail.html?slug=${slug}" class="block group relative">
                <div class="relative bg-slate-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-700 aspect-[2/3]">
                    
                    <div class="absolute top-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 text-[10px] font-bold text-white rounded border border-slate-700 shadow-sm z-10">
                        ${info}
                    </div>

                    <img src="${poster}" class="w-full h-full object-cover group-hover:opacity-90 transition" alt="${anime.title}">
                    
                    <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-10">
                        <h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
                            ${anime.title}
                        </h3>
                    </div>
                </div>
            </a>
        `;
  });
}

// ==========================================
// 5. RENDER PAGINATION
// ==========================================
function renderPagination(pagination, currentPage) {
  paginationContainer.innerHTML = "";
  if (!pagination) return;

  const { hasPrevPage, hasNextPage, totalPages } = pagination;
  currentPage = parseInt(currentPage);

  // Tombol Prev
  if (hasPrevPage) {
    paginationContainer.innerHTML += createPageBtn(
      currentPage - 1,
      "Prev",
      false
    );
  } else {
    paginationContainer.innerHTML += createPageBtn(1, "Prev", true);
  }

  // Info Halaman (Contoh: Page 1 of 44)
  paginationContainer.innerHTML += `
        <span class="px-4 py-2 mt-20 bg-slate-800 text-slate-400 text-sm font-semibold rounded-lg border border-slate-700">
            Page ${currentPage} / ${totalPages}
        </span>
    `;

  // Tombol Next
  if (hasNextPage) {
    paginationContainer.innerHTML += createPageBtn(
      currentPage + 1,
      "Next",
      false
    );
  } else {
    paginationContainer.innerHTML += createPageBtn(totalPages, "Next", true);
  }
}

function createPageBtn(page, text, disabled) {
  if (disabled) {
    return `
            <button disabled class="px-4 py-2 bg-slate-800 text-slate-600 rounded-lg text-sm font-bold cursor-not-allowed border border-slate-800">
                ${text}
            </button>
        `;
  }
  return `
        <a href="?id=${genreId}&page=${page}" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-purple-900/20">
            ${text}
        </a>
    `;
}

// ==========================================
// 6. ERROR HANDLER
// ==========================================
function showError(msg) {
  animeList.innerHTML = `<div class="col-span-full text-center py-20 text-slate-500 italic">${msg}</div>`;
  paginationContainer.innerHTML = "";
}

// EXECUTE
loadGenreAnime(currentPageParam);
