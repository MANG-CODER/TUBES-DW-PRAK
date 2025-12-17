const SCHEDULE_API = "https://www.sankavollerei.com/anime/schedule";
const dayTabs = document.getElementById("dayTabs");
const dayTabsContainer = document.getElementById("dayTabsContainer");
const scheduleContainer = document.getElementById("scheduleContainer");
const pageTitle = document.getElementById("pageTitle");
const searchInput = document.getElementById("searchInput");
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

let globalScheduleData = [];

// FUNGSI LOADING
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
        <h3 class="text-xl font-bold text-white mb-1 tracking-wide">Memuat Jadwal...</h3>
    </div>
  `;
}

if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// CACHE HELPER
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}
function getCache(key, maxAge = 1000 * 60 * 60) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.time < maxAge) return c.data;
  } catch (e) {}
  return null;
}

function handleLocalSearch(query) {
  const cleanQuery = query.toLowerCase().trim();
  if (cleanQuery.length < 3) {
    renderSchedule(globalScheduleData);
    if (dayTabsContainer) dayTabsContainer.style.display = "block";
    if (pageTitle) pageTitle.innerText = "📅 Jadwal Rilis Anime";
    return;
  }
  if (dayTabsContainer) dayTabsContainer.style.display = "none";
  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Mencari:</span> "${cleanQuery}"`;
  scheduleContainer.innerHTML = "";
  let results = [];
  globalScheduleData.forEach((dayGroup) => {
    dayGroup.anime_list.forEach((anime) => {
      if (anime.title.toLowerCase().includes(cleanQuery)) {
        anime.dayName = dayGroup.day;
        results.push(anime);
      }
    });
  });
  if (results.length > 0) {
    let cardsHtml = "";
    results.forEach((anime) => {
      cardsHtml += renderSearchCard(anime);
    });
    scheduleContainer.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">${cardsHtml}</div>`;
  } else {
    scheduleContainer.innerHTML = `<div class="col-span-full text-center py-10 text-slate-400">Tidak ditemukan anime "<b>${cleanQuery}</b>".</div>`;
  }
}

function renderSearchCard(anime) {
  const slug = anime.slug || anime.url.split("/").pop();
  const poster = anime.poster || "https://via.placeholder.com/300x400";
  return `<a href="detail.html?slug=${slug}" class="block group relative"><div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-800 aspect-[2/3]"><div class="absolute top-2 left-2 bg-purple-600 px-3 py-1 text-[11px] font-bold text-white rounded shadow-md z-10">📅 ${anime.dayName}</div><img src="${poster}" class="w-full h-full object-cover group-hover:opacity-80 transition" alt="${anime.title}"><div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8"><h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">${anime.title}</h3></div></div></a>`;
}

if (searchInput)
  searchInput.addEventListener("keyup", (e) =>
    handleLocalSearch(e.target.value)
  );
if (mobileSearchForm) {
  mobileSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    mobileSearchInput.blur();
    handleLocalSearch(mobileSearchInput.value);
  });
}

async function loadSchedule() {
  const cacheKey = "schedule-data";
  const cached = getCache(cacheKey);

  // 1. CEK CACHE
  if (cached) {
    globalScheduleData = cached;
    renderSchedule(cached);
    return;
  }

  // 2. SHOW LOADING
  showLoadingUI(scheduleContainer);

  // 3. FETCH
  try {
    const res = await fetch(SCHEDULE_API);
    const json = await res.json();
    if (json.status === "success" && json.data) {
      globalScheduleData = json.data;
      setCache(cacheKey, json.data);
      renderSchedule(json.data);
    } else {
      scheduleContainer.innerHTML = `<p class="text-center text-red-400">Gagal memuat jadwal.</p>`;
    }
  } catch (e) {
    console.error(e);
    scheduleContainer.innerHTML = `<p class="text-center text-red-400">Terjadi kesalahan koneksi.</p>`;
  }
}

function renderSchedule(data) {
  dayTabs.innerHTML = "";
  scheduleContainer.innerHTML = "";
  if (dayTabsContainer) dayTabsContainer.style.display = "block";
  if (pageTitle) pageTitle.innerText = "📅 Jadwal Rilis Anime";
  const daysMap = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  const today = daysMap[new Date().getDay()];
  data.forEach((item, index) => {
    const dayName = item.day;
    const isToday = dayName === today;
    const sectionId = `day-${index}`;
    const btnClass = isToday
      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-1 ring-purple-400"
      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50";
    dayTabs.innerHTML += `<a href="#${sectionId}" class="w-full flex items-center justify-center px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${btnClass}">${dayName} ${
      isToday ? "🔥" : ""
    }</a>`;
    let animeCards = "";
    item.anime_list.forEach((anime) => {
      const slug = anime.slug || anime.url.split("/").pop();
      animeCards += `<a href="detail.html?slug=${slug}" class="block group relative"><div class="relative aspect-[2/3] bg-slate-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-700"><img src="${anime.poster}" class="w-full h-full object-cover group-hover:opacity-80 transition" alt="${anime.title}"><div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8"><h3 class="text-xs sm:text-sm font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors leading-tight">${anime.title}</h3></div></div></a>`;
    });
    scheduleContainer.innerHTML += `<section id="${sectionId}" class="scroll-mt-32 pt-6 first:border-0 first:pt-0"><div class="flex items-center gap-3 mb-6 pb-2"><div class="w-1 h-8 bg-purple-500 rounded-full"></div><span class="text-xl sm:text-2xl font-bold text-white tracking-wide">${dayName}</span>${
      isToday
        ? '<span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-lg shadow-red-500/20">Hari Ini</span>'
        : ""
    }</div><div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">${animeCards}</div></section>`;
  });
}

loadSchedule();
