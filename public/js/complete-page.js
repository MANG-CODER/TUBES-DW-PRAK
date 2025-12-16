const ongoingList = document.getElementById("ongoingList");
const completeList = document.getElementById("completeList");
const ongoingPagination = document.getElementById("ongoingPagination");
const completePagination = document.getElementById("completePagination");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle"); // ✨ TAMBAH VARIABEL INI

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime";
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

let ongoingPage = 1;
let completePage = 1;

// ✅ RENDER CARD
function renderCard(container, anime, type = "ongoing") {
  container.innerHTML += `
    <div class="bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition">
      <img src="${anime.poster}" class="w-full h-60 object-cover">
      <div class="p-3">
        <h3 class="text-sm font-bold line-clamp-2">${anime.title}</h3>
        ${
          type === "ongoing"
            ? `<p class="text-xs text-gray-400">${anime.current_episode}</p>`
            : `<p class="text-xs text-yellow-400">⭐ ${anime.rating}</p>`
        }
      </div>
    </div>
  `;
}

// ✅ PAGINATION
function renderPagination(container, currentPage, callbackName) {
  container.innerHTML = `
    <button onclick="${callbackName}(${currentPage - 1})"
      class="px-4 py-2 bg-slate-800 rounded ${
        currentPage === 1 ? "opacity-40 pointer-events-none" : ""
      }">
      Prev
    </button>

    <span class="px-4 py-2 bg-purple-700 rounded">${currentPage}</span>

    <button onclick="${callbackName}(${currentPage + 1})"
      class="px-4 py-2 bg-slate-800 rounded">
      Next
    </button>
  `;
}

// ✅ HELPER CACHE
function setCache(key, data) {
  const cache = { timestamp: Date.now(), data };
  localStorage.setItem(key, JSON.stringify(cache));
}

function getCache(key, maxAge = 1000 * 60 * 25) {
  // 25 menit
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const parsed = JSON.parse(cached);
  if (Date.now() - parsed.timestamp > maxAge) return null;

  return parsed.data;
}

// ✅ FETCH ONGOING (Dibiarkan, tetapi tidak dipanggil di halaman ini)
async function getOngoing(page = 1) {
  ongoingPage = page;
  // ... (kode getOngoing) ...
}

// ✅ FETCH COMPLETE
async function getComplete(page = 1) {
  completePage = page;

  const cacheKey = `complete-page-${page}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    completeList.innerHTML = "";
    cachedData.data.completeAnimeData.forEach((anime) =>
      renderCard(completeList, anime, "complete")
    );
    renderPagination(completePagination, completePage, "getComplete");
    return;
  }

  try {
    const res = await fetch(`${COMPLETE_API}/${page}`);
    const data = await res.json();

    setCache(cacheKey, data);

    completeList.innerHTML = "";
    data.data.completeAnimeData.forEach((anime) =>
      renderCard(completeList, anime, "complete")
    );
    renderPagination(completePagination, completePage, "getComplete");
  } catch (err) {
    console.error(err);
    completeList.innerHTML = "❌ Gagal memuat Complete";
  }
}

// 🎯 FUNGSI SEARCH YANG DIESUAIKAN UNTUK HALAMAN COMPLETE
searchInput.addEventListener("keyup", async function () {
    const q = this.value.trim();

    if (q.length < 3) {
        // 1. Jika input kurang dari 3, tampilkan judul
        if (pageTitle) pageTitle.hidden = false;
        
        getComplete();
        return;
    }
    
    // 2. Jika input 3 atau lebih, sembunyikan judul
    // ✨ PERBAIKAN DARI KESALAHAN SEBELUMNYA: Gunakan pageTitle.hidden = true
    if (pageTitle) pageTitle.hidden = true; 

    const cacheKey = `search-${q}`;
    const cachedData = getCache(cacheKey, 1000 * 60 * 5); 
    if (cachedData) {
        completeList.innerHTML = "";
        completePagination.innerHTML = "";
        
        cachedData.data.forEach((anime) =>
            renderCard(completeList, anime, "complete") 
        );
        return;
    }

    try {
        const res = await fetch(`${SEARCH_API}${q}`);
        const data = await res.json();
        setCache(cacheKey, data);

        completeList.innerHTML = "";
        completePagination.innerHTML = "";

        if (data.data && data.data.length > 0) {
            data.data.forEach((anime) => renderCard(completeList, anime, "complete")); 
        } else {
            completeList.innerHTML = "<p class='text-center w-full'>Tidak ditemukan anime dengan kata kunci tersebut.</p>";
        }
        
    } catch (err) {
        console.error(err);
        completeList.innerHTML = "<p class='text-center w-full'>Terjadi kesalahan saat mencari.</p>";
    }
});

// ✅ LOAD AWAL
getComplete();