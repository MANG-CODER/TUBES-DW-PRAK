// ==========================
// 1. SETUP VARIABEL
// ==========================
const ongoingList = document.getElementById("ongoingList");
const completeList = document.getElementById("completeList");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");

// [BARU] Tombol Lihat Semua (Pastikan ada id="ongoingViewAllBtn" di HTML)
const ongoingViewAllBtn = document.getElementById("ongoingViewAllBtn");

// Mobile Elements
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// API URL
const ONGOING_API = "https://www.sankavollerei.com/anime/ongoing-anime/";
const COMPLETE_API = "https://www.sankavollerei.com/anime/complete-anime";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

// ==========================
// 2. FUNGSI LOADING
// ==========================
function showLoadingUI(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-20 min-h-[300px]">
        <div class="relative flex items-center justify-center w-20 h-20 mb-4">
             <div class="absolute inset-0 rounded-full border-[5px] border-slate-800 border-t-purple-500 animate-spin"></div>
             <div class="absolute inset-2 rounded-full border-4 border-slate-800 opacity-50"></div>
             <div class="relative bg-slate-900 rounded-full p-3 shadow-2xl shadow-purple-500/20">
                 <img src="./img/Icon MangNime.png" class="w-8 h-8 object-contain animate-pulse" alt="Loading">
             </div>
        </div>
        <h3 class="text-xl font-bold text-white mb-1 tracking-wide">Memuat Data...</h3>
        <p class="text-slate-400 text-xs animate-pulse">Mohon tunggu sebentar...</p>
    </div>
  `;
}

// ==========================
// 3. CACHE SYSTEM
// ==========================
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) {
    console.warn("Cache Full");
  }
}

function getCache(key, maxAge = 1000 * 60 * 15) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.timestamp < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// ==========================
// 4. NAVIGASI MOBILE
// ==========================
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 5. LOGIKA PENCARIAN
// ==========================

const searchDropdown = document.getElementById("searchResultsDropdown");
let searchTimeout = null;

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    // 1. Jika input kosong, reset ke default
    if (query.length === 0) {
      searchDropdown.classList.add("hidden");
      resetPageToDefault(); // Panggil fungsi reset
      return;
    }

    searchDropdown.classList.remove("hidden");
    renderLoadingSearch(query);

    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 800);
  });

  // Hide saat klik luar
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
      searchDropdown.classList.add("hidden");
    }
  });
}

// [PENTING] Fungsi Reset Halaman
function resetPageToDefault() {
  // 1. Reset Judul
  if (pageTitle) {
    pageTitle.innerHTML = `<span class="w-2 h-8 bg-purple-600 rounded-full"></span> 🔥 Ongoing Anime`;
  }

  // 2. Munculkan kembali Section Complete
  if (completeList && completeList.parentElement) {
    completeList.parentElement.style.display = "block";
  }

  // 3. Munculkan kembali Tombol Lihat Semua (Ongoing)
  if (ongoingViewAllBtn) {
    ongoingViewAllBtn.style.display = "inline-flex"; // Kembalikan tombol
  }

  // 4. Load Ulang Data Home (PAKSA / FORCE)
  getHomeData(true);
}

// A. UI LOADING SEARCH
function renderLoadingSearch(query) {
  searchDropdown.innerHTML = `
        <div class="px-4 py-3 bg-slate-800 border-b border-slate-700">
             <p class="text-xs text-slate-400 truncate">
                Mencari: <span class="text-purple-400 font-bold">"${query}"</span>
             </p>
        </div>
        <div class="pt-4 h-60 flex flex-col items-center justify-center bg-slate-900">
            <div class="h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs text-slate-500">Mencari Anime...</p>
        </div>
    `;
}

// B. FUNGSI FETCH SEARCH
async function performSearch(query) {
  if (query.length < 3) return;
  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();
    const list = extractAnimeList(json);
    renderDropdownResults(list, query);
  } catch (err) {
    console.error(err);
    searchDropdown.innerHTML = `<div class="p-4 text-center text-red-400 text-xs">Gagal memuat data.</div>`;
  }
}

// C. UI HASIL SEARCH DROPDOWN
function renderDropdownResults(list, query) {
  let htmlContent = `
        <div class="flex justify-between items-center px-4 py-3 bg-slate-800 border-b border-slate-700">
             <div class="flex-1 min-w-0 pr-2">
                <p class="text-xs text-slate-400 truncate">
                    Hasil: <span class="text-purple-400 font-bold">"${query}"</span>
                </p>
             </div>
             <span class="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">${list.length}</span>
        </div>
        <div style="max-height: 450px; overflow-y: auto;" class="custom-scrollbar bg-slate-900">
    `;

  if (list.length === 0) {
    htmlContent += `
            <div class="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 py-10">
                <span class="text-2xl mb-2">ternyata kosong 🗿</span>
                <p class="text-xs">Anime tidak ditemukan.</p>
            </div>
        </div>`;
  } else {
    list.slice(0, 50).forEach((anime) => {
      const slug = anime.animeId || anime.href?.split("/").pop() || "#";
      const poster = anime.poster || "https://via.placeholder.com/100x140";
      const title = anime.title || "No Title";
      const rating = anime.score ? `⭐ ${anime.score}` : "";
      const status = anime.status || "Unknown";

      let statusColor = "bg-gray-600";
      if (status.toLowerCase().includes("ongoing"))
        statusColor = "bg-purple-600";
      else if (status.toLowerCase().includes("completed"))
        statusColor = "bg-green-600";

      htmlContent += `
                <a href="detail.html?slug=${slug}" class="group flex gap-3 p-3 hover:bg-slate-800 transition-colors border-slate-800/50 w-full relative">
                    <div class="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-slate-800">
                        <img src="${poster}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="${title}">
                    </div>
                    <div class="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 class="text-sm font-bold text-slate-200 truncate group-hover:text-purple-400 transition-colors">${title}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] text-yellow-400 font-bold">${rating}</span>
                            <span class="text-[10px] text-white px-2 ${statusColor} border rounded-full border-slate-700 rounded">${status}</span>
                        </div>
                    </div>
                </a>`;
    });
    htmlContent += `</div>`;
  }

  // FOOTER (DENGAN TOMBOL LIHAT SEMUA)
  htmlContent += `
        <div class="block text-center py-4 bg-slate-800 hover:bg-purple-600 text-xs font-bold text-slate-400 hover:text-white transition-colors border-t border-slate-700 cursor-pointer" onclick="showPageResults('${query}')">
            LIHAT SEMUA HASIL
        </div>
    `;

  searchDropdown.innerHTML = htmlContent;
}

// D. FUNGSI RENDER KE HALAMAN UTAMA
async function showPageResults(query) {
  // 1. Sembunyikan Dropdown
  searchDropdown.classList.add("hidden");

  // 2. Ubah Judul Halaman
  if (pageTitle) {
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil Pencarian:</span> "${query}"`;
  }

  // 3. Sembunyikan Section "Complete Anime" & Tombol Lihat Semua
  if (completeList && completeList.parentElement) {
    completeList.parentElement.style.display = "none";
  }
  if (ongoingViewAllBtn) {
    ongoingViewAllBtn.style.display = "none"; // Sembunyikan tombol saat search aktif
  }

  // 4. Tampilkan Loading di Container Utama (Ongoing List)
  showLoadingUI(ongoingList);

  // 5. Fetch Ulang
  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    // Kosongkan container
    if (ongoingList) ongoingList.innerHTML = "";

    if (list.length > 0) {
      // Render Grid Card
      list.forEach((anime) => renderCard(ongoingList, anime, "search"));
    } else {
      ongoingList.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10">Tidak ditemukan anime dengan kata kunci "${query}".</div>`;
    }
  } catch (err) {
    console.error(err);
    ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Terjadi kesalahan saat mencari.</div>`;
  }
}

// ==========================
// 6. HELPER & RENDER
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

  let label = "";
  const episodeCount = anime.episodes || anime.episode;
  const scoreCount = anime.score;
  const isComplete =
    type === "complete" ||
    (anime.status && anime.status.toLowerCase() === "completed");

  if (isComplete) {
    label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${scoreCount || "-"}</div>`;
  } else if (episodeCount) {
    label = `<div class="absolute top-2 left-2 bg-purple-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Ep ${episodeCount}</div>`;
  } else {
    label = `<div class="absolute top-2 left-2 bg-gray-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">Anime</div>`;
  }

  const dateInfo = anime.lastReleaseDate
    ? `Selesai: ${anime.lastReleaseDate}`
    : anime.releaseDay || "";

  container.innerHTML += `
    <a href="detail.html?slug=${slug}" class="block group">
      <div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-800">
        ${label}
        <div class="aspect-[3/4] overflow-hidden">
             <img src="${poster}" alt="${title}" class="w-full h-full object-cover">
        </div>
        <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
          <h3 class="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">${title}</h3>
          <p class="text-[10px] text-gray-400 mt-1">${dateInfo}</p>
        </div>
      </div>
    </a>
  `;
}

// ==========================
// 7. LOAD HOME DATA (FIXED)
// ==========================
async function getHomeData(force = false) {
  // [FIX] Jika dipaksa (force = true), abaikan pengecekan children
  if (
    !force &&
    ongoingList.children.length > 1 &&
    completeList.children.length > 1
  )
    return;

  // Jika dipaksa, bersihkan container agar data lama/hasil search hilang
  if (force) {
    ongoingList.innerHTML = "";
    if (completeList) completeList.innerHTML = "";
  }

  const cacheKeyOngoing = "home-ongoing";
  const cacheKeyComplete = "home-complete";
  const cachedOngoing = getCache(cacheKeyOngoing);
  const cachedComplete = getCache(cacheKeyComplete);

  // --- 1. LOAD ONGOING ---
  if (cachedOngoing) {
    renderHomeSection(ongoingList, cachedOngoing, "ongoing");
  } else {
    if (!force) showLoadingUI(ongoingList);
    try {
      const res = await fetch(`${ONGOING_API}?page=1`);
      const json = await res.json();
      const list = extractAnimeList(json);
      setCache(cacheKeyOngoing, list);
      renderHomeSection(ongoingList, list, "ongoing");
    } catch (e) {
      console.error(e);
      ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Gagal memuat ongoing.</div>`;
    }
  }

  // --- 2. LOAD COMPLETE ---
  if (completeList) {
    if (cachedComplete) {
      renderHomeSection(completeList, cachedComplete, "complete");
    } else {
      if (!force) showLoadingUI(completeList);
      try {
        const res = await fetch(`${COMPLETE_API}?page=1`);
        const json = await res.json();
        const list = extractAnimeList(json);
        setCache(cacheKeyComplete, list);
        renderHomeSection(completeList, list, "complete");
      } catch (e) {
        console.error(e);
        completeList.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Gagal memuat complete.</div>`;
      }
    }
  }
}

function renderHomeSection(container, list, type) {
  if (container) container.innerHTML = "";
  list.slice(0, 12).forEach((a) => renderCard(container, a, type));
}

// Panggil fungsi utama
getHomeData();

// ==========================
// 8. HERO CAROUSEL LOGIC
// ==========================
const heroCarousel = document.getElementById("heroCarousel");
const prevBtn = document.getElementById("prevSlide");
const nextBtn = document.getElementById("nextSlide");
const dotsContainer = document.getElementById("carouselDots");

let currentSlideIndex = 0;
let heroAnimes = [];
let slideInterval;

async function initHeroCarousel() {
  if (!heroCarousel) return;

  const cachedOngoing = getCache("home-ongoing");
  if (cachedOngoing && cachedOngoing.length > 0) {
    heroAnimes = cachedOngoing.slice(0, 5);
    renderHeroSlides();
    startAutoSlide();
    return;
  }

  try {
    const res = await fetch(`${ONGOING_API}?page=1`);
    const json = await res.json();
    const list = extractAnimeList(json);
    heroAnimes = list.slice(0, 5);

    if (heroAnimes.length > 0) {
      renderHeroSlides();
      startAutoSlide();
    }
  } catch (e) {
    console.error("Hero Error:", e);
    heroCarousel.innerHTML = `<div class="h-full flex items-center justify-center text-slate-500">Gagal memuat banner.</div>`;
  }
}

function renderHeroSlides() {
  heroCarousel.innerHTML = "";
  if (dotsContainer) dotsContainer.innerHTML = "";

  heroAnimes.forEach((anime, index) => {
    const slug = anime.animeId || anime.href?.split("/").pop() || "#";
    const isActive =
      index === 0 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none";
    const poster =
      anime.poster || "https://via.placeholder.com/300x400?text=No+Image";

    const slide = document.createElement("div");
    slide.className = `absolute top-0 left-0 w-full h-full transition-all duration-700 ease-in-out ${isActive}`;

    slide.innerHTML = `
            <div class="absolute inset-0 z-0 overflow-hidden">
                <img src="${poster}" class="w-full h-full object-cover scale-110 brightness-[0.3]" style="filter: blur(5px); transform: scale(1.2);" alt="bg-blur">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-slate-900/80"></div>
            </div>

            <div class="relative z-10 h-full w-full flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 px-6 md:px-12 lg:px-16 py-8">
                
                <div class="hidden md:block flex-shrink-0 w-64 lg:w-[280px] relative group perspective">
                     <div class="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/30 border-[3px] border-white/10 transform transition-all duration-500 group-hover:scale-105">
                        <img src="${poster}" class="w-full h-full object-cover" alt="${anime.title}">
                     </div>
                </div>
                
                <div class="md:hidden w-32 shadow-xl rounded-xl overflow-hidden border-2 border-white/10 mt-2">
                      <img src="${poster}" class="w-full h-full object-cover" alt="${anime.title}">
                </div>

                <div class="flex-1 max-w-2xl text-center md:text-left space-y-4 md:space-y-5 text-white">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-md mx-auto md:mx-0">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span class="text-xs font-bold text-purple-200 uppercase tracking-wide">Trending Now</span>
                    </div>

                    <h2 class="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow-2xl line-clamp-2">${anime.title}</h2>
                    
                    <div class="flex flex-wrap justify-center md:justify-start items-center gap-3 text-sm text-slate-200 font-medium">
                        <span class="flex items-center gap-1.5"><span class="text-purple-400">📅</span> ${anime.releaseDay || "Update"}</span>
                        <span class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/30 border border-white/10 backdrop-blur-md">
                           <span class="text-purple-400">📺</span> ${anime.episodes ? `Episode ${anime.episodes}` : "Ongoing"}
                        </span>
                    </div>

                    <p class="text-slate-300 text-xs md:text-base line-clamp-3 max-w-lg leading-relaxed opacity-90 mx-auto md:mx-0 drop-shadow-sm">
                        Nonton anime <b>${anime.title}</b> subtitle Indonesia gratis kualitas HD tanpa iklan yang mengganggu hanya di MangNime.
                    </p>

                    <div class="pt-2">
                        <a href="detail.html?slug=${slug}" class="group inline-flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-1 ring-1 ring-white/20">
                            <span>Tonton Sekarang</span>
                        </a>
                    </div>
                </div>
            </div>
        `;
    heroCarousel.appendChild(slide);

    if (dotsContainer) {
      const dot = document.createElement("button");
      dot.className = `h-1.5 rounded-full transition-all duration-300 ${index === 0 ? "bg-purple-500 w-8" : "bg-white/30 w-4 hover:bg-white/50"}`;
      dot.addEventListener("click", () => showSlide(index));
      dotsContainer.appendChild(dot);
    }
  });
}

function showSlide(index) {
  if (!heroCarousel.children.length) return;
  const slides = heroCarousel.children;
  const dots = dotsContainer ? dotsContainer.children : [];

  if (index >= heroAnimes.length) index = 0;
  if (index < 0) index = heroAnimes.length - 1;
  currentSlideIndex = index;

  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove("opacity-100", "z-10");
    slides[i].classList.add("opacity-0", "z-0", "pointer-events-none");
    if (dots.length > i)
      dots[i].className =
        `h-1.5 w-4 rounded-full transition-all duration-300 bg-white/30 hover:bg-white/60`;
  }

  slides[currentSlideIndex].classList.remove(
    "opacity-0",
    "z-0",
    "pointer-events-none",
  );
  slides[currentSlideIndex].classList.add("opacity-100", "z-10");
  if (dots.length > currentSlideIndex)
    dots[currentSlideIndex].className =
      `h-1.5 w-8 rounded-full transition-all duration-300 bg-purple-500`;
}

function nextSlide() {
  showSlide(currentSlideIndex + 1);
}
function prevSlide() {
  showSlide(currentSlideIndex - 1);
}
function startAutoSlide() {
  clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 5000);
}

if (nextBtn)
  nextBtn.addEventListener("click", () => {
    nextSlide();
    startAutoSlide();
  });
if (prevBtn)
  prevBtn.addEventListener("click", () => {
    prevSlide();
    startAutoSlide();
  });

document.addEventListener("DOMContentLoaded", initHeroCarousel);
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(initHeroCarousel, 100);
}
