// ==========================
// 1. SETUP VARIABEL (ELEMENT HTML)
// ==========================
const ongoingList = document.getElementById("ongoingList");
const completeList = document.getElementById("completeList");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");

// Element Mobile
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// API URL
const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime/";
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

// ==========================
// 2. NAVIGASI (MENU SANDWICH)
// ==========================
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 3. LOGIKA PENCARIAN (LIVE SEARCH)
// ==========================
async function handleLiveSearch(query) {
  const cleanQuery = query.trim();

  // A. KEMBALI KE DEFAULT (Jika ketikan < 3 huruf)
  if (cleanQuery.length < 3) {
    if (pageTitle)
      pageTitle.innerHTML = `<span class="w-2 h-8 bg-purple-600 rounded-full"></span> 🔥 Ongoing Anime`;

    // Tampilkan kembali section Complete
    if (completeList && completeList.parentElement) {
      completeList.parentElement.style.display = "block";
    }

    getHomeData();
    return;
  }

  // B. MODE PENCARIAN
  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil Pencarian:</span> "${cleanQuery}"`;

  // Sembunyikan section Complete
  if (completeList && completeList.parentElement) {
    completeList.parentElement.style.display = "none";
  }

  // Tampilkan Loading
  if (ongoingList)
    ongoingList.innerHTML = `<div class="col-span-full text-center text-white animate-pulse">Mencari "${cleanQuery}"...</div>`;

  try {
    const res = await fetch(`${SEARCH_API}${cleanQuery}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    if (ongoingList) ongoingList.innerHTML = "";

    if (list.length > 0) {
      // Saat search, kita anggap type bukan 'complete' agar muncul Episode
      list.forEach((anime) => renderCard(ongoingList, anime, "search"));
    } else {
      ongoingList.innerHTML = `<p class="col-span-full text-center text-slate-400">Tidak ditemukan anime dengan kata kunci tersebut.</p>`;
    }
  } catch (err) {
    console.error(err);
    if (ongoingList)
      ongoingList.innerHTML = `<p class="col-span-full text-center text-red-400">Error saat mencari.</p>`;
  }
}

// --- Event Listener Desktop ---
if (searchInput) {
  searchInput.addEventListener("keyup", function () {
    handleLiveSearch(this.value);
  });
}

// --- Event Listener Mobile ---
if (mobileSearchForm && mobileSearchInput) {
  mobileSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    mobileSearchInput.blur();
    handleLiveSearch(mobileSearchInput.value);
  });
}

// ==========================
// 4. HELPER & RENDER (UPDATED)
// ==========================
function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (Array.isArray(json.animeList)) return json.animeList;
  if (json.data && Array.isArray(json.data)) return json.data;
  return [];
}

// ✅ FUNGSI RENDER CARD (SESUAI REQUEST BARU)
// ==========================================
// ✅ FUNGSI RENDER CARD (PERBAIKAN LOGIKA BADGE)
// ==========================================
function renderCard(container, anime, type = "ongoing") {
  const slug = anime.animeId || anime.href?.split("/").pop() || "#";
  const poster = anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  const title = anime.title || "No Title";

  // --- LOGIKA BADGE CERDAS ---
  let label = "";
  
  // 1. Ambil data yang tersedia (Cek variasi nama field API)
  const episodeCount = anime.episodes || anime.episode; 
  const scoreCount = anime.score;
  const isComplete = type === "complete" || anime.status === "Completed";

  // 2. Tentukan apa yang mau ditampilkan
  if (isComplete) {
      // Jika halaman Complete, Prioritaskan Score
      label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${scoreCount || "-"}</div>`;
  } 
  else if (episodeCount) {
      // Jika ada data Episode, Tampilkan Episode
      label = `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Ep ${episodeCount}</div>`;
  } 
  else if (scoreCount) {
      // Jika tidak ada episode (misal hasil search anime lama), Tampilkan Score sebagai fallback
      label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${scoreCount}</div>`;
  } 
  else {
      // Jika data benar-benar kosong
      label = `<div class="absolute top-2 left-2 bg-gray-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Anime</div>`;
  }

  // --- LOGIKA TANGGAL ---
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

// ==========================
// 5. LOAD DATA HOME DEFAULT
// ==========================
async function getHomeData() {
  if (ongoingList.children.length > 1 && completeList.children.length > 1)
    return;

  try {
    if (ongoingList)
      ongoingList.innerHTML = `<div class="col-span-full text-center text-white animate-pulse">Loading...</div>`;

    // Fetch Ongoing
    const res1 = await fetch(`${ONGOING_API}?page=1`);
    const data1 = await res1.json();
    const list1 = extractAnimeList(data1);

    if (ongoingList) ongoingList.innerHTML = "";
    list1.slice(0, 12).forEach((a) => renderCard(ongoingList, a, "ongoing"));

    // Fetch Complete
    if (completeList) {
      completeList.innerHTML = "";
      const res2 = await fetch(`${COMPLETE_API}?page=1`);
      const data2 = await res2.json();
      const list2 = extractAnimeList(data2);
      list2
        .slice(0, 12)
        .forEach((a) => renderCard(completeList, a, "complete"));
    }
  } catch (e) {
    console.error(e);
  }
}

getHomeData();
