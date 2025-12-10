const ongoingList = document.getElementById("ongoingList");
const completeList = document.getElementById("completeList");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");
const pageTitle1 = document.getElementById("pageTitle1");

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime/";
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

// ==========================
// 1. HELPER CACHE
// ==========================
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}

function getCache(key, maxAge = 1000 * 60 * 15) {
  // Cache 15 Menit
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.time > maxAge) return null;
    return parsed.data;
  } catch (e) {
    return null;
  }
}

// ==========================
// 2. HELPER DATA
// ==========================
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

  const badge =
    type === "ongoing"
      ? `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Ep ${
          anime.episodes || "?"
        }</div>`
      : `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${
          anime.score || "-"
        }</div>`;

  container.innerHTML += `
    <a href="detail.html?slug=${slug}" class="block group relative">
      <div class="relative bg-slate-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-700 aspect-[2/3]">
        ${badge}
        <img src="${poster}" alt="${title}" class="w-full h-full object-cover">
        
        <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
          <h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
            ${title}
          </h3>
          <p class="text-[10px] text-gray-400 mt-1">
             ${anime.releaseDay || anime.lastReleaseDate || ""}
          </p>
        </div>
      </div>
    </a>
  `;
}

// ==========================
// 3. FETCH HOME DATA (FIX JUMLAH ITEM)
// ==========================
async function getHomeData() {
  try {
    // --- FETCH ONGOING ---
    const cacheKeyOngoing = "home-ongoing";
    let list1 = getCache(cacheKeyOngoing);

    if (!list1) {
      const res1 = await fetch(`${ONGOING_API}?page=1`);
      const data1 = await res1.json();
      list1 = extractAnimeList(data1);
      setCache(cacheKeyOngoing, list1);
    }

    if (ongoingList) {
      ongoingList.innerHTML = "";
      if (list1.length > 0) {
        // 🔥 PERBAIKAN: Ubah slice(0, 6) menjadi slice(0, 12) atau hapus slice() untuk tampilkan semua
        list1
          .slice(0, 12)
          .forEach((a) => renderCard(ongoingList, a, "ongoing"));
      } else {
        ongoingList.innerHTML = `<p class="col-span-full text-center text-gray-500">Gagal memuat data.</p>`;
      }
    }

    // --- FETCH COMPLETE ---
    const cacheKeyComplete = "home-complete";
    let list2 = getCache(cacheKeyComplete);

    if (!list2) {
      const res2 = await fetch(`${COMPLETE_API}?page=1`);
      const data2 = await res2.json();
      list2 = extractAnimeList(data2);
      setCache(cacheKeyComplete, list2);
    }

    if (completeList) {
      completeList.innerHTML = "";
      if (list2.length > 0) {
        // 🔥 PERBAIKAN: Ubah slice(0, 6) menjadi slice(0, 12)
        list2
          .slice(0, 12)
          .forEach((a) => renderCard(completeList, a, "complete"));
      } else {
        completeList.innerHTML = `<p class="col-span-full text-center text-gray-500">Gagal memuat data.</p>`;
      }
    }
  } catch (e) {
    console.error(e);
  }
}

// ==========================
// 4. SEARCH REDIRECT
// ==========================
if (searchInput) {
  searchInput.addEventListener("keyup", async (e) => {
    if (e.key === "Enter" || e.target.value.length > 3) {
      window.location.href = `ongoing.html?q=${e.target.value}`;
    }
  });
}

// ==========================
// 5. EXECUTE
// ==========================
if (ongoingList)
  ongoingList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Loading...</div>`;
if (completeList)
  completeList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Loading...</div>`;

getHomeData();
