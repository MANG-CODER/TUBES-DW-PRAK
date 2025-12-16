// ==========================
// 1. INIT
// ==========================
const SCHEDULE_API = "https://www.sankavollerei.com/anime/schedule";
const dayTabs = document.getElementById("dayTabs");
const scheduleContainer = document.getElementById("scheduleContainer");
const searchInput = document.getElementById("searchInput"); // Opsional jika ada di nav

// ==========================
// 2. CACHE SYSTEM
// ==========================
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}

function getCache(key, maxAge = 1000 * 60 * 60) {
  // Cache 1 Jam (Jadwal jarang berubah)
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.time < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// ==========================
// 3. FETCH SCHEDULE
// ==========================
async function loadSchedule() {
  const cacheKey = "schedule-data";
  const cached = getCache(cacheKey);

  if (cached) {
    renderSchedule(cached);
    return;
  }

  try {
    const res = await fetch(SCHEDULE_API);
    const json = await res.json();

    if (json.status === "success" && json.data) {
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
// 4. RENDER UI
// ==========================
function renderSchedule(data) {
  dayTabs.innerHTML = "";
  scheduleContainer.innerHTML = "";

  // Dapatkan hari ini (Indonesian format)
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

    // 1. Render Tab Button
    const btnClass = isToday
      ? "bg-purple-600 text-white border-purple-500"
      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700";

    dayTabs.innerHTML += `
            <a href="#${sectionId}" 
               class="px-5 py-2 rounded-full text-sm font-bold border transition whitespace-nowrap scroll-mt-24 ${btnClass}">
               ${dayName} ${isToday ? "🔥" : ""}
            </a>
        `;

    // 2. Render Anime List per Hari
    let animeCards = "";
    item.anime_list.forEach((anime) => {
      const slug = anime.slug || anime.url.split("/").pop(); // Fallback slug
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

    // Wrapper per Hari
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

// ==========================
// 5. SEARCH REDIRECT (Opsional)
// ==========================
if (searchInput) {
  searchInput.addEventListener("keyup", async (e) => {
    if (e.key === "Enter" || e.target.value.length > 3) {
      window.location.href = `ongoing.html?q=${e.target.value}`;
    }
  });
}

// EXECUTE
loadSchedule();
