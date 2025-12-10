const ongoingList = document.getElementById("ongoingList");
const completeList = document.getElementById("completeList");
const ongoingPagination = document.getElementById("ongoingPagination");
const completePagination = document.getElementById("completePagination");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");
const pageTitle1 = document.getElementById("pageTitle1");

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime";
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

let ongoingPage = 1;
let completePage = 1;

/* =============================
   RENDER CARD
============================= */
function renderCard(container, anime, type = "ongoing") {
  container.innerHTML += `
    <a href="detail.html?slug=${anime.animeId}" class="block">
      <div class="bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition">
        <img src="${anime.poster}" class="w-full h-60 object-cover">
        <div class="p-3">
          <h3 class="text-sm font-bold line-clamp-2">${anime.title}</h3>

          ${
            type === "ongoing"
              ? `<p class="text-xs text-gray-400">Episode ${anime.episodes}</p>`
              : `<p class="text-xs text-yellow-400">⭐ ${anime.score}</p>`
          }

        </div>
      </div>
    </a>
  `;
}

/* =============================
   PAGINATION
============================= */
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

/* =============================
   CACHE
============================= */
function setCache(key, data) {
  const cache = { timestamp: Date.now(), data };
  localStorage.setItem(key, JSON.stringify(cache));
}

function getCache(key, maxAge = 1000 * 60 * 25) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const parsed = JSON.parse(cached);
  if (Date.now() - parsed.timestamp > maxAge) return null;

  return parsed.data;
}

/* =============================
   FETCH ONGOING
============================= */
async function getOngoing(page = 1) {
  ongoingPage = page;

  // PERBAIKAN 2: Tambah backtick
  const cacheKey = `ongoing-page-${page}`;
  const cached = getCache(cacheKey);

  if (cached) {
    ongoingList.innerHTML = "";
    cached.animeList.forEach((anime) =>
      renderCard(ongoingList, anime, "ongoing")
    );
    renderPagination(ongoingPagination, ongoingPage, "getOngoing");
    return;
  }

  try {
    // PERBAIKAN 3: Tambah backtick pada URL Fetch
    const res = await fetch(`${ONGOING_API}?page=${page}`);
    if (!res.ok) throw new Error("API Ongoing bermasalah");

    const data = await res.json();
    const ongoingData = data.data;

    setCache(cacheKey, ongoingData);

    ongoingList.innerHTML = "";
    ongoingData.animeList.forEach((anime) =>
      renderCard(ongoingList, anime, "ongoing")
    );

    renderPagination(ongoingPagination, ongoingPage, "getOngoing");

  } catch (err) {
    console.error(err);
    ongoingList.innerHTML = "❌ Gagal memuat Ongoing Anime.";
  }
}

/* =============================
   FETCH COMPLETE
============================= */
async function getComplete(page = 1) {
  completePage = page;

  // PERBAIKAN 4: Tambah backtick
  const cacheKey = `complete-page-${page}`;
  const cached = getCache(cacheKey);

  if (cached) {
    completeList.innerHTML = "";
    cached.animeList.forEach((anime) =>
      renderCard(completeList, anime, "complete")
    );
    renderPagination(completePagination, completePage, "getComplete");
    return;
  }

  try {
    const res = await fetch(`${COMPLETE_API}?page=${page}`);
    if (!res.ok) throw new Error("API Complete bermasalah");

    const data = await res.json();
    const completeData = data.data;

    setCache(cacheKey, completeData);

    completeList.innerHTML = "";
    completeData.animeList.forEach((anime) =>
      renderCard(completeList, anime, "complete")
    );

    renderPagination(completePagination, completePage, "getComplete");

  } catch (err) {
    console.error(err);
    completeList.innerHTML = "❌ Gagal memuat Complete Anime.";
  }
}



/* =============================
   SEARCH
============================= */
searchInput.addEventListener("keyup", async function () {
  const q = this.value.trim();

  if (q.length < 3) {
    if (pageTitle) pageTitle.hidden = false;
    if (pageTitle1) pageTitle1.hidden = false;

    getOngoing();
    getComplete();
    return;
  }

  if (pageTitle) pageTitle.hidden = true;
  if (pageTitle1) pageTitle1.hidden = true;

  const cacheKey = `search-${q}`;
  const cached = getCache(cacheKey, 1000 * 60 * 5);

  if (cached) {
    ongoingList.innerHTML = "";
    completeList.innerHTML = "";
    ongoingPagination.innerHTML = "";
    completePagination.innerHTML = "";

    cached.data.forEach((anime) =>
      renderCard(ongoingList, anime)
    );
    return;
  }

  try {
    const res = await fetch(`${SEARCH_API}${q}`);
    if (!res.ok) throw new Error("API Search Error");

    const data = await res.json();
    setCache(cacheKey, data);

    ongoingList.innerHTML = "";
    completeList.innerHTML = "";
    ongoingPagination.innerHTML = "";
    completePagination.innerHTML = "";

    if (data.data && data.data.length > 0) {
      data.data.forEach((anime) =>
        renderCard(ongoingList, anime)
      );
    } else {
      ongoingList.innerHTML = "<p class='text-center w-full'>Tidak ditemukan anime.</p>";
    }

  } catch (err) {
    console.error(err);
    ongoingList.innerHTML = "<p class='text-center w-full'>Kesalahan saat mencari.</p>";
  }
});

/* =============================
   LOAD AWAL
============================= */
getOngoing();
getComplete();
