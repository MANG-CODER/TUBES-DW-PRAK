// ==========================
// 1. INIT VARIABLES
// ==========================
const SCHEDULE_API = "https://www.sankavollerei.com/anime/schedule";

// Container Elements
const dayTabs = document.getElementById("dayTabs");
const dayTabsContainer = document.getElementById("dayTabsContainer");
const scheduleContainer = document.getElementById("scheduleContainer");
const pageTitle = document.getElementById("pageTitle");

// Search & Nav Elements
const searchInput = document.getElementById("searchInput");
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// GLOBAL DATA STORE (Untuk Search Lokal)
let globalScheduleData = [];

// ==========================
// 2. NAVIGASI (MENU SANDWICH)
// ==========================
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 3. LOGIKA PENCARIAN (LOCAL FILTER)
// ==========================
function handleLocalSearch(query) {
  const cleanQuery = query.toLowerCase().trim();

  // A. KEMBALI KE DEFAULT (Jika input < 3 huruf)
  if (cleanQuery.length < 3) {
    renderSchedule(globalScheduleData); // Tampilkan jadwal normal
    if (dayTabsContainer) dayTabsContainer.style.display = "block"; // Munculkan tab hari
    if (pageTitle) pageTitle.innerText = "📅 Jadwal Rilis Anime";
    return;
  }

  // B. MODE SEARCH
  if (dayTabsContainer) dayTabsContainer.style.display = "none"; // Sembunyikan tab hari
  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Mencari:</span> "${cleanQuery}"`;
  scheduleContainer.innerHTML = ""; // Bersihkan konten

  // Filter Data Jadwal
  let results = [];

  // Loop setiap hari
  globalScheduleData.forEach((dayGroup) => {
    // Loop setiap anime di hari tersebut
    dayGroup.anime_list.forEach((anime) => {
      if (anime.title.toLowerCase().includes(cleanQuery)) {
        // Tambahkan info hari ke object anime agar bisa ditampilkan
        anime.dayName = dayGroup.day;
        results.push(anime);
      }
    });
  });

  // Render Hasil
  if (results.length > 0) {
    let cardsHtml = "";
    results.forEach((anime) => {
      cardsHtml += renderSearchCard(anime);
    });

    scheduleContainer.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
                ${cardsHtml}
            </div>
        `;
  } else {
    scheduleContainer.innerHTML = `
            <div class="col-span-full text-center py-10 text-slate-400">
                <p>Tidak ditemukan anime "<b>${cleanQuery}</b>" di jadwal tayang.</p>
                <p class="text-xs mt-2 text-slate-500">Coba cari di menu Home untuk pencarian database lengkap.</p>
            </div>`;
  }
}

// Render Kartu Khusus Search (Menampilkan Badge Hari)
function renderSearchCard(anime) {
  const slug = anime.slug || anime.url.split("/").pop();
  const poster = anime.poster || "https://via.placeholder.com/300x400";

  return `
        <a href="detail.html?slug=${slug}" class="block group relative">
            <div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-800 aspect-[2/3]">
                
                <div class="absolute top-2 left-2 bg-purple-600 px-3 py-1 text-[11px] font-bold text-white rounded shadow-md z-10">
                    📅 ${anime.dayName}
                </div>

                <img src="${poster}" class="w-full h-full object-cover group-hover:opacity-80 transition" alt="${anime.title}">
                
                <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
                    <h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
                        ${anime.title}
                    </h3>
                </div>
            </div>
        </a>
    `;
}

// --- Event Listeners ---
if (searchInput) {
  searchInput.addEventListener("keyup", (e) =>
    handleLocalSearch(e.target.value)
  );
}

if (mobileSearchForm && mobileSearchInput) {
  mobileSearchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    mobileSearchInput.blur();
    handleLocalSearch(mobileSearchInput.value);
  });
  // Opsional: Live search di mobile juga
  mobileSearchInput.addEventListener("keyup", (e) =>
    handleLocalSearch(e.target.value)
  );
}

// ==========================
// 4. CACHE SYSTEM
// ==========================
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

// ==========================
// 5. FETCH SCHEDULE
// ==========================
async function loadSchedule() {
  const cacheKey = "schedule-data";
  const cached = getCache(cacheKey);

  if (cached) {
    globalScheduleData = cached; // Simpan ke global
    renderSchedule(cached);
    return;
  }

  try {
    const res = await fetch(SCHEDULE_API);
    const json = await res.json();

    if (json.status === "success" && json.data) {
      globalScheduleData = json.data; // Simpan ke global
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

// ==========================
// 6. RENDER DEFAULT UI
// ==========================
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

    // Render Tab
    const btnClass = isToday
      ? "bg-purple-600 text-white border-purple-500"
      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700";

    dayTabs.innerHTML += `
        <a href="#${sectionId}" 
           class="px-5 py-2 rounded-full text-sm font-bold border transition whitespace-nowrap scroll-mt-24 ${btnClass}">
           ${dayName} ${isToday ? "🔥" : ""}
        </a>
    `;

    // Render Cards
    let animeCards = "";
    item.anime_list.forEach((anime) => {
      const slug = anime.slug || anime.url.split("/").pop();
      animeCards += `
        <a href="detail.html?slug=${slug}" class="block group relative">
            <div class="relative aspect-[2/3] bg-slate-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-700">
                <img src="${anime.poster}" class="w-full h-full object-cover group-hover:opacity-80 transition" alt="${anime.title}">
                <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-8">
                    <h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">
                        ${anime.title}
                    </h3>
                </div>
            </div>
        </a>
      `;
    });

    // Wrapper Hari
    scheduleContainer.innerHTML += `
        <section id="${sectionId}" class="scroll-mt-32">
            <div class="flex items-center gap-3 mb-6 border-b border-slate-800 pb-2">
                <span class="text-2xl font-bold text-white">${dayName}</span>
                ${
                  isToday
                    ? '<span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Hari Ini</span>'
                    : ""
                }
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${animeCards}
            </div>
        </section>
    `;
  });
}

// EXECUTE
loadSchedule();
