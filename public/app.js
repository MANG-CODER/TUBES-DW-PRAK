// ==========================
// 1. SETUP VARIABEL
// ==========================
const ongoingList = document.getElementById("ongoingList");
const completeList = document.getElementById("completeList");
const searchInput = document.getElementById("searchInput");
const pageTitle = document.getElementById("pageTitle");

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
// 2. FUNGSI LOADING KEREN (SERAGAM)
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
  // Cache 15 Menit
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
// 5. LOGIKA PENCARIAN (LIVE SEARCH)
// ==========================
async function handleLiveSearch(query) {
  const cleanQuery = query.trim();

  // A. KEMBALI KE DEFAULT
  if (cleanQuery.length < 3) {
    if (pageTitle)
      pageTitle.innerHTML = `<span class="w-2 h-8 bg-purple-600 rounded-full"></span> 🔥 Ongoing Anime`;
    // Tampilkan kembali section complete
    if (completeList && completeList.parentElement) {
      completeList.parentElement.style.display = "block";
    }
    // Load ulang data home (akan ambil dari cache jika ada)
    getHomeData();
    return;
  }

  // B. MODE SEARCH
  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil Pencarian:</span> "${cleanQuery}"`;
  // Sembunyikan section complete saat search
  if (completeList && completeList.parentElement) {
    completeList.parentElement.style.display = "none";
  }

  // Cek Cache Search
  const cacheKey = `search-${cleanQuery}`;
  const cachedData = getCache(cacheKey, 1000 * 60 * 5); // Cache search 5 menit
  if (cachedData) {
    renderSearchResults(cachedData);
    return;
  }

  // Tampilkan Loading
  showLoadingUI(ongoingList);

  try {
    const res = await fetch(`${SEARCH_API}${cleanQuery}`);
    const json = await res.json();

    // Simpan Cache
    setCache(cacheKey, json);

    renderSearchResults(json);
  } catch (err) {
    console.error(err);
    ongoingList.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Error saat mencari.</div>`;
  }
}

function renderSearchResults(json) {
  const list = extractAnimeList(json);
  if (ongoingList) ongoingList.innerHTML = "";

  if (list.length > 0) {
    list.forEach((anime) => renderCard(ongoingList, anime, "search"));
  } else {
    ongoingList.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10">Tidak ditemukan anime.</div>`;
  }
}

// Event Listeners Search
if (searchInput) {
  searchInput.addEventListener("keyup", (e) =>
    handleLiveSearch(e.target.value)
  );
}
if (mobileSearchForm) {
  mobileSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    mobileSearchInput.blur();
    handleLiveSearch(mobileSearchInput.value);
  });
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
  const isComplete = type === "complete" || anime.status === "Completed";

  if (isComplete) {
    label = `<div class="absolute top-2 left-2 bg-green-600 px-2 py-1 text-[10px] font-bold text-white rounded shadow-md">⭐ ${
      scoreCount || "-"
    }</div>`;
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
        <img src="${poster}" alt="${title}" class="w-full h-64 object-cover">
        <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
          <h3 class="text-sm font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">${title}</h3>
          <p class="text-[10px] text-gray-400 mt-1">${dateInfo}</p>
        </div>
      </div>
    </a>
  `;
}

// ==========================
// 7. LOAD HOME DATA (DENGAN CACHE)
// ==========================
async function getHomeData() {
  // Cek apakah data sudah tampil di layar (DOM Check) agar tidak flicker saat kembali dari search
  if (ongoingList.children.length > 1 && completeList.children.length > 1)
    return;

  const cacheKeyOngoing = "home-ongoing";
  const cacheKeyComplete = "home-complete";

  const cachedOngoing = getCache(cacheKeyOngoing);
  const cachedComplete = getCache(cacheKeyComplete);

  // --- 1. LOAD ONGOING ---
  if (cachedOngoing) {
    renderHomeSection(ongoingList, cachedOngoing, "ongoing");
  } else {
    showLoadingUI(ongoingList); // Tampilkan Loader
    try {
      const res = await fetch(`${ONGOING_API}?page=1`);
      const json = await res.json();
      const list = extractAnimeList(json);

      setCache(cacheKeyOngoing, list); // Simpan Cache
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
      showLoadingUI(completeList); // Tampilkan Loader
      try {
        const res = await fetch(`${COMPLETE_API}?page=1`);
        const json = await res.json();
        const list = extractAnimeList(json);

        setCache(cacheKeyComplete, list); // Simpan Cache
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
  // Render maksimal 12 item untuk Home
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

  // Coba ambil dari Cache Ongoing dulu untuk Hero (biar cepat)
  const cachedOngoing = getCache("home-ongoing");

  if (cachedOngoing && cachedOngoing.length > 0) {
    heroAnimes = cachedOngoing.slice(0, 5);
    renderHeroSlides();
    startAutoSlide();
    return;
  }

  // Jika tidak ada cache, fetch ulang (tanpa loader HTML, biarkan default HTML loader)
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
                        <img src="${poster}" class="w-full h-full object-cover" alt="${
      anime.title
    }">
                     </div>
                </div>
                
                <div class="md:hidden w-32 shadow-xl rounded-xl overflow-hidden border-2 border-white/10 mt-2">
                      <img src="${poster}" class="w-full h-full object-cover" alt="${
      anime.title
    }">
                </div>

                <div class="flex-1 max-w-2xl text-center md:text-left space-y-4 md:space-y-5 text-white">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-md mx-auto md:mx-0">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span class="text-xs font-bold text-purple-200 uppercase tracking-wide">Trending Now</span>
                    </div>

                    <h2 class="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight drop-shadow-2xl line-clamp-2">${
                      anime.title
                    }</h2>
                    
                    <div class="flex flex-wrap justify-center md:justify-start items-center gap-3 text-sm text-slate-200 font-medium">
                        <span class="flex items-center gap-1.5"><span class="text-purple-400">📅</span> ${
                          anime.releaseDay || "Update"
                        }</span>
                        <span class="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/30 border border-white/10 backdrop-blur-md">
                           <span class="text-purple-400">📺</span> ${
                             anime.episodes
                               ? `Episode ${anime.episodes}`
                               : "Ongoing"
                           }
                        </span>
                    </div>

                    <p class="text-slate-300 text-xs md:text-base line-clamp-3 max-w-lg leading-relaxed opacity-90 mx-auto md:mx-0 drop-shadow-sm">
                        Nonton anime <b>${
                          anime.title
                        }</b> subtitle Indonesia gratis kualitas HD tanpa iklan yang mengganggu hanya di MangNime.
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
      dot.className = `h-1.5 rounded-full transition-all duration-300 ${
        index === 0 ? "bg-purple-500 w-8" : "bg-white/30 w-4 hover:bg-white/50"
      }`;
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
      dots[
        i
      ].className = `h-1.5 w-4 rounded-full transition-all duration-300 bg-white/30 hover:bg-white/60`;
  }

  slides[currentSlideIndex].classList.remove(
    "opacity-0",
    "z-0",
    "pointer-events-none"
  );
  slides[currentSlideIndex].classList.add("opacity-100", "z-10");
  if (dots.length > currentSlideIndex)
    dots[
      currentSlideIndex
    ].className = `h-1.5 w-8 rounded-full transition-all duration-300 bg-purple-500`;
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
