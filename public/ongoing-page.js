// ==========================
// SETUP VARIABEL
// ==========================
const ongoingList = document.getElementById("ongoingList");
const pageTitle = document.getElementById("pageTitle");
const pagination = document.getElementById("ongoingPagination");

// Element Search
const searchInput = document.getElementById("searchInput");
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");

// Element Navbar
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime/";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

// ==========================
// 1. NAVIGASI (MENU SANDWICH)
// ==========================
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 2. LOGIKA PENCARIAN (LIVE SEARCH)
// ==========================
async function handleLiveSearch(query) {
  const cleanQuery = query.trim();

  // A. KEMBALI KE DEFAULT (Input < 3 huruf)
  if (cleanQuery.length < 3) {
    if (pageTitle) pageTitle.innerText = "🔥 Semua Ongoing Anime";
    if (pagination) pagination.style.display = "flex";
    getOngoing(1);
    return;
  }

  // B. MODE SEARCH
  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil:</span> "${cleanQuery}"`;
  if (pagination) pagination.style.display = "none";

  if (ongoingList)
    ongoingList.innerHTML = `<div class="col-span-full text-center text-white animate-pulse">Mencari...</div>`;

  try {
    const res = await fetch(`${SEARCH_API}${cleanQuery}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    if (ongoingList) ongoingList.innerHTML = "";

    if (list.length > 0) {
      // Gunakan tipe 'search' agar badge yang muncul adalah Episode, bukan Score
      list.forEach((anime) => renderCard(ongoingList, anime, "search"));
    } else {
      ongoingList.innerHTML = `<div class="col-span-full text-center text-slate-400">Tidak ditemukan.</div>`;
    }
  } catch (e) {
    console.error(e);
    ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400">Error search.</div>`;
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
// 3. HELPER & RENDER (UPDATED)
// ==========================

// ✅ FUNGSI RENDER CARD (SESUAI REQUEST BARU)
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

function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (Array.isArray(json.animeList)) return json.animeList;
  return [];
}

async function getOngoing(page = 1) {
  try {
    const res = await fetch(`${ONGOING_API}?page=${page}`);
    const json = await res.json();
    const list = extractAnimeList(json);
    if (ongoingList) ongoingList.innerHTML = "";

    // Pass "ongoing" agar badge yang muncul adalah Episode
    list.forEach((a) => renderCard(ongoingList, a, "ongoing"));

    renderPaginationUI(page);
  } catch (e) {
    console.error(e);
  }
}

function renderPaginationUI(page) {
  if (!pagination) return;
  pagination.innerHTML = `
        <button onclick="getOngoing(${
          page - 1
        })" class="px-4 py-2 bg-slate-800 rounded" ${
    page <= 1 ? "disabled" : ""
  }>Prev</button>
        <span class="px-4 py-2 text-purple-400 font-bold">${page}</span>
        <button onclick="getOngoing(${
          page + 1
        })" class="px-4 py-2 bg-slate-800 rounded">Next</button>
    `;
}

// Load Awal
getOngoing(1);
