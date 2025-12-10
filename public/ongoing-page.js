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

// ✅ RENDER CARD
function renderCard(container, anime) {
  const slug = anime.href.split("/").pop(); // ✅ AMBIL SLUG YANG VALID

  container.innerHTML += `
    <a href="detail.html?slug=${slug}" class="block group">
      <div class="bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition">
        <img src="${anime.poster}" class="w-full h-60 object-cover">
        <div class="p-3">
          <h3 class="text-sm font-bold line-clamp-2 group-hover:text-purple-400">
            ${anime.title}
          </h3>
        </div>
      </div>
    </a>
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

// ✅ FETCH ONGOING
async function getOngoing(page = 1) {
  ongoingPage = page;

  const cacheKey = `ongoing-page-${page}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    ongoingList.innerHTML = "";
    cachedData.data.animeList.forEach((anime) =>
      renderCard(ongoingList, anime, "ongoing")
    );
    renderPagination(ongoingPagination, ongoingPage, "getOngoing");
    return;
  }

  try {
    const res = await fetch(`${ONGOING_API}?page=${page}`);
    const data = await res.json();

    setCache(cacheKey, data);

    ongoingList.innerHTML = "";
    data.data.animeList.forEach((anime) =>
      renderCard(ongoingList, anime, "ongoing")
    );
    renderPagination(ongoingPagination, ongoingPage, "getOngoing");
  } catch (err) {
    console.error(err);
    ongoingList.innerHTML = "❌ Gagal memuat Ongoing";
  }
}

// ✅ FETCH COMPLETE
async function getComplete(page = 1) {
  completePage = page;

  const cacheKey = `complete-page-${page}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    completeList.innerHTML = "";
    cachedData.data.animeList.forEach((anime) =>
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
    data.data.animeList.forEach((anime) =>
      renderCard(completeList, anime, "complete")
    );
    renderPagination(completePagination, completePage, "getComplete");
  } catch (err) {
    console.error(err);
    completeList.innerHTML = "❌ Gagal memuat Complete";
  }
}

// ✅ SEARCH NAVBAR
searchInput.addEventListener("keyup", async function () {
  const q = this.value.trim();

  if (q.length < 3) {
    if (pageTitle) pageTitle.hidden = false;
    // Ketika input kurang dari 3, kembalikan ke daftar awal
    getOngoing();
    // Hapus getComplete() karena tidak ada di halaman ini!
    // getComplete(); 
    return;
  }
  if (pageTitle) pageTitle.hidden = true;
  const cacheKey = `search-${q}`;
  const cachedData = getCache(cacheKey, 1000 * 60 * 5); 
  if (cachedData) {
    ongoingList.innerHTML = "";
    // Hapus baris ini!
    // completeList.innerHTML = "";
    ongoingPagination.innerHTML = "";
    // Hapus baris ini!
    // completePagination.innerHTML = "";
    cachedData.data.forEach((anime) =>
      renderCard(ongoingList, anime, "ongoing")
    );
    return;
  }

  try {
    const res = await fetch(`${SEARCH_API}${q}`);
    const data = await res.json();
    setCache(cacheKey, data);

    ongoingList.innerHTML = "";
    // Hapus baris ini!
    // completeList.innerHTML = "";
    ongoingPagination.innerHTML = "";
    // Hapus baris ini!
    // completePagination.innerHTML = "";

    // Periksa jika hasil pencarian kosong
    if (data.data && data.data.length > 0) {
        data.data.forEach((anime) => renderCard(ongoingList, anime, "ongoing"));
    } else {
        ongoingList.innerHTML = "<p class='text-center w-full'>Tidak ditemukan anime dengan kata kunci tersebut.</p>";
    }
    
  } catch (err) {
    console.error(err);
    ongoingList.innerHTML = "<p class='text-center w-full'>Terjadi kesalahan saat mencari.</p>";
  }
});

// ✅ LOAD AWAL
getOngoing();
