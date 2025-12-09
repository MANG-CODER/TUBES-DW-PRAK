const ongoingList = document.getElementById("ongoingList");
const ongoingPagination = document.getElementById("ongoingPagination");

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime";

let ongoingPage = 1;

// RENDER CARD
function renderCard(container, anime) {
  container.innerHTML += `
    <div class="bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition">
      <img src="${anime.poster}" class="w-full h-60 object-cover">
      <div class="p-3">
        <h3 class="text-sm font-bold line-clamp-2">${anime.title}</h3>
        <p class="text-xs text-gray-400">${anime.current_episode}</p>
      </div>
    </div>
  `;
}

// PAGINATION
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

// HELPER CACHE
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

// FETCH ONGOING
async function getOngoing(page = 1) {
  ongoingPage = page;
  const cacheKey = `ongoing-page-${page}`;
  const cachedData = getCache(cacheKey);

  if (cachedData) {
    ongoingList.innerHTML = "";
    cachedData.data.ongoingAnimeData.forEach((anime) =>
      renderCard(ongoingList, anime)
    );
    renderPagination(ongoingPagination, ongoingPage, "getOngoing");
    return;
  }

  try {
    const res = await fetch(`${ONGOING_API}?page=${page}`);
    const data = await res.json();

    setCache(cacheKey, data);

    ongoingList.innerHTML = "";
    data.data.ongoingAnimeData.forEach((anime) =>
      renderCard(ongoingList, anime)
    );
    renderPagination(ongoingPagination, ongoingPage, "getOngoing");
  } catch (err) {
    console.error(err);
    ongoingList.innerHTML = "❌ Gagal memuat Ongoing";
  }
}

// LOAD AWAL
getOngoing();
