// ==========================
// 1. SETUP VARIABEL & API
// ==========================
const ongoingList = document.getElementById("ongoingList");
const completeList = document.getElementById("completeList");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");

const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime/";
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

// ==========================
// 2. FUNGSI PENCARIAN (GLOBAL)
// ==========================

// Fungsi Redirect (Pindah Halaman)
function executeSearch(query) {
  const cleanQuery = query.trim();
  if (cleanQuery.length > 0) {
    // Kita tetap arahkan ke ongoing.html, tapi nanti kita tangkap datanya
    window.location.href = `ongoing.html?q=${encodeURIComponent(cleanQuery)}`;
  }
}

// Logic untuk Mobile (Dipanggil dari onsubmit HTML)
window.cariAnimeMobile = function (event) {
  event.preventDefault();
  const mobileInput = document.getElementById("mobileSearchInput");
  if (mobileInput) {
    mobileInput.blur();
    executeSearch(mobileInput.value);
  }
};

// Logic untuk Desktop
if (searchInput) {
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      executeSearch(searchInput.value);
    }
  });
}

// ==========================
// 3. HELPER RENDERING
// ==========================
function renderCard(container, anime, type) {
  // Fallback logic yang aman
  const slug = anime.animeId || anime.href?.split("/").pop() || "#";
  const poster = anime.poster || "https://via.placeholder.com/300x400";
  const title = anime.title || "No Title";

  // Badge logic
  let badge = "";
  if (type === "search") {
    badge = `<div class="absolute top-2 left-2 bg-blue-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Hasil</div>`;
  } else if (type === "ongoing") {
    badge = `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Ep ${
      anime.episodes || "?"
    }</div>`;
  } else {
    badge = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${
      anime.score || "-"
    }</div>`;
  }

  container.innerHTML += `
        <a href="detail.html?slug=${slug}" class="block group relative">
            <div class="relative bg-slate-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-700 aspect-[2/3]">
                ${badge}
                <img src="${poster}" alt="${title}" class="w-full h-full object-cover">
                <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
                    <h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">${title}</h3>
                    <p class="text-[10px] text-gray-400 mt-1">${
                      anime.releaseDay || anime.lastReleaseDate || ""
                    }</p>
                </div>
            </div>
        </a>`;
}

function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (Array.isArray(json.animeList)) return json.animeList;
  if (json.data && Array.isArray(json.data)) return json.data; // Fallback umum
  return [];
}

// ==========================
// 4. LOGIKA UTAMA (LOAD DATA)
// ==========================
async function loadPageContent() {
  // 1. Cek apakah ada parameter "?q=" di URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get("q");

  // JIKA ADA PENCARIAN (MODE SEARCH)
  if (searchQuery && ongoingList) {
    console.log("Mode Pencarian Aktif:", searchQuery);

    // Ubah Judul Halaman
    if (pageTitle)
      pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil Pencarian:</span> "${searchQuery}"`;

    // Sembunyikan Section Complete (agar fokus ke hasil search)
    if (completeList) {
      completeList.parentElement.style.display = "none"; // Sembunyikan section complete
    }

    ongoingList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Sedang mencari "${searchQuery}"...</div>`;

    try {
      // Fetch ke API Search
      const res = await fetch(`${SEARCH_API}?q=${searchQuery}`);
      const json = await res.json();
      const results = extractAnimeList(json);

      ongoingList.innerHTML = ""; // Bersihkan loading

      if (results.length > 0) {
        results.forEach((a) => renderCard(ongoingList, a, "search"));
      } else {
        ongoingList.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400">
                    <p class="text-xl mb-2">😔</p>
                    Tidak ditemukan anime dengan kata kunci "${searchQuery}"
                </div>`;
      }
    } catch (e) {
      console.error(e);
      ongoingList.innerHTML = `<p class="col-span-full text-center text-red-400">Terjadi kesalahan saat mencari.</p>`;
    }

    return; // BERHENTI DI SINI (Jangan load data Ongoing biasa)
  }

  // JIKA TIDAK ADA PENCARIAN (MODE NORMAL)
  // Load Ongoing & Complete seperti biasa
  if (ongoingList)
    ongoingList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Loading...</div>`;
  if (completeList)
    completeList.innerHTML = `<div class="col-span-full text-center py-10 text-white animate-pulse">Loading...</div>`;

  try {
    // Fetch Ongoing
    const res1 = await fetch(`${ONGOING_API}?page=1`);
    const data1 = await res1.json();
    const list1 = extractAnimeList(data1);
    if (ongoingList) {
      ongoingList.innerHTML = "";
      list1.slice(0, 12).forEach((a) => renderCard(ongoingList, a, "ongoing"));
    }

    // Fetch Complete
    const res2 = await fetch(`${COMPLETE_API}?page=1`);
    const data2 = await res2.json();
    const list2 = extractAnimeList(data2);
    if (completeList) {
      completeList.innerHTML = "";
      list2
        .slice(0, 12)
        .forEach((a) => renderCard(completeList, a, "complete"));
    }
  } catch (e) {
    console.error(e);
  }
}

// Jalankan Fungsi Utama
loadPageContent();

// ==========================
// 5. MENU SANDWICH
// ==========================
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classLi~
}
