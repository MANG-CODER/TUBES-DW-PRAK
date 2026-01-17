// ==========================
// SETUP VARIABEL
// ==========================
const GENRE_LIST_API = "https://www.sankavollerei.com/anime/genre";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

const genreContainer = document.getElementById("genreContainer");
const genreFilter = document.getElementById("genreFilter");
const filterSection = document.getElementById("filterSection");
const pageTitle = document.getElementById("pageTitle");
const pageDesc = document.getElementById("pageDesc");

// Variabel Search
const searchInput = document.getElementById("searchInput");
const searchDropdown = document.getElementById("searchResultsDropdown");
const mobileSearchForm = document.getElementById("mobileSearchForm");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
let searchTimeout = null;

let globalGenreList = [];
const colors = [
  "hover:border-purple-500 hover:shadow-purple-500/20 text-purple-400",
  "hover:border-blue-500 hover:shadow-blue-500/20 text-blue-400",
  "hover:border-green-500 hover:shadow-green-500/20 text-green-400",
  "hover:border-pink-500 hover:shadow-pink-500/20 text-pink-400",
  "hover:border-yellow-500 hover:shadow-yellow-500/20 text-yellow-400",
  "hover:border-cyan-500 hover:shadow-cyan-500/20 text-cyan-400",
  "hover:border-red-500 hover:shadow-red-500/20 text-red-400",
];

// FUNGSI LOADING UMUM
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
        <h3 class="text-xl font-bold text-white mb-1 tracking-wide">Memuat...</h3>
    </div>
  `;
}

// NAVIGASI MOBILE
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
function getCache(key, maxAge = 1000 * 60 * 60 * 24) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.time < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// ==========================
// 1. LOGIKA SEARCH DROPDOWN
// ==========================
if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    // 1. Reset jika kosong -> Kembali ke tampilan Genre
    if (query.length === 0) {
      if (searchDropdown) searchDropdown.classList.add("hidden");
      resetToGenreList();
      return;
    }

    // 2. Loading Dropdown
    if (searchDropdown) {
      searchDropdown.classList.remove("hidden");
      renderLoadingSearch(query);
    }

    // 3. Debounce
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 800);
  });

  // Hide klik luar
  document.addEventListener("click", (e) => {
    if (
      searchDropdown &&
      !searchInput.contains(e.target) &&
      !searchDropdown.contains(e.target)
    ) {
      searchDropdown.classList.add("hidden");
    }
  });
}

function renderLoadingSearch(query) {
  if (!searchDropdown) return;
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
        <div class="bg-slate-800 border-t border-slate-700 p-2">
            <div class="h-4 w-24 bg-slate-700 rounded mx-auto animate-pulse"></div>
        </div>
    `;
}

async function performSearch(query) {
  if (query.length < 3) return;

  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();
    const list = extractAnimeList(json);
    renderDropdownResults(list, query);
  } catch (err) {
    console.error(err);
    if (searchDropdown)
      searchDropdown.innerHTML = `<div class="p-4 text-center text-red-400 text-xs">Gagal memuat data.</div>`;
  }
}

function renderDropdownResults(list, query) {
  if (!searchDropdown) return;

  // HEADER
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
                <span class="text-2xl mb-2">🤔</span>
                <p class="text-xs">Tidak ada anime ditemukan.</p>
            </div>
        </div>`;
  } else {
    // LIST ITEM
    list.slice(0, 30).forEach((anime) => {
      const slug = anime.animeId || anime.href?.split("/").pop() || "#";
      const poster = anime.poster || "https://via.placeholder.com/100x140";
      const title = anime.title || "No Title";
      const rating = anime.score ? `⭐ ${anime.score}` : "";
      const status = anime.status || "Unknown";

      // Logic Status Color
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
                        <h4 class="text-sm font-bold text-slate-200 truncate group-hover:text-purple-400 transition-colors">
                            ${title}
                        </h4>
                        
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] text-yellow-400 font-bold">${rating}</span>
                            <span class="text-[10px] text-white px-2 ${statusColor} border rounded-full border-slate-700 rounded">${status}</span>
                        </div>
                    </div>
                </a>
            `;
    });
    htmlContent += `</div>`; // Tutup div Body
  }

  // FOOTER
  htmlContent += `
        <div class="block text-center py-4 bg-slate-800 hover:bg-purple-600 text-xs font-bold text-slate-400 hover:text-white transition-colors border-t border-slate-700 cursor-pointer" onclick="showPageResults('${query}')">
            LIHAT SEMUA HASIL
        </div>
    `;

  searchDropdown.innerHTML = htmlContent;
}

// 2. TAMPILKAN HASIL SEARCH DI GRID GENRE
async function showPageResults(query) {
  if (searchDropdown) searchDropdown.classList.add("hidden");

  // UI Update
  if (pageTitle)
    pageTitle.innerHTML = `<span class="text-purple-400">🔍 Hasil:</span> "${query}"`;
  if (pageDesc) pageDesc.style.display = "none";
  if (filterSection) filterSection.style.display = "none";

  showLoadingUI(genreContainer);

  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();
    const list = extractAnimeList(json);

    if (genreContainer) genreContainer.innerHTML = "";

    if (list.length > 0) {
      // Render Card Anime
      list.forEach((anime) => renderAnimeCard(genreContainer, anime));
    } else {
      genreContainer.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10">Tidak ditemukan anime.</div>`;
    }
  } catch (e) {
    console.error(e);
    genreContainer.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Error saat mencari.</div>`;
  }
}

// ==========================
// 3. LOGIKA HALAMAN GENRE
// ==========================
function resetToGenreList() {
  if (pageTitle) pageTitle.innerText = "🧩 Jelajahi Genre";
  if (pageDesc) pageDesc.style.display = "block";
  if (filterSection) filterSection.style.display = "block";
  if (globalGenreList.length > 0) renderGenres(globalGenreList);
  else loadGenres();
}

async function loadGenres() {
  const cacheKey = "genre-list";
  const cached = getCache(cacheKey);
  if (cached) {
    globalGenreList = cached;
    renderGenres(cached);
    return;
  }

  showLoadingUI(genreContainer);
  try {
    const res = await fetch(GENRE_LIST_API);
    const json = await res.json();
    if (json.status === "success" && json.data && json.data.genreList) {
      setCache(cacheKey, json.data.genreList);
      globalGenreList = json.data.genreList;
      renderGenres(json.data.genreList);
    } else {
      genreContainer.innerHTML = `<p class="col-span-full text-center text-red-400">Gagal memuat genre.</p>`;
    }
  } catch (e) {
    console.error(e);
    genreContainer.innerHTML = `<p class="col-span-full text-center text-red-400">Terjadi kesalahan koneksi.</p>`;
  }
}

function renderGenres(list) {
  genreContainer.innerHTML = "";
  if (list.length === 0) {
    genreContainer.innerHTML = `<p class="col-span-full text-center text-slate-500 italic">Genre tidak ditemukan.</p>`;
    return;
  }
  list.forEach((genre, index) => {
    const colorClass = colors[index % colors.length];
    const card = document.createElement("a");
    card.href = `genre-result.html?id=${genre.genreId}`;
    card.className = `group bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 ${colorClass}`;

    card.innerHTML = `
        <div class="mb-3 p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 transition">
            <span class="text-2xl opacity-80 group-hover:opacity-100 transition transform group-hover:scale-110 block">
                ${getIconForGenre(genre.title)}
            </span>
        </div>
        <h3 class="font-bold text-sm sm:text-base text-slate-200 group-hover:text-white transition">
            ${genre.title}
        </h3>`;
    genreContainer.appendChild(card);
  });
}

// Render Card Anime
function renderAnimeCard(container, anime) {
  const slug = anime.animeId || anime.href?.split("/").pop() || "#";
  const poster = anime.poster || "https://via.placeholder.com/300x450";
  const info = anime.score
    ? `⭐ ${anime.score}`
    : anime.type || anime.status || "Anime";

  const status = anime.status || "";
  let statusBadge = "";
  if (status) {
    const isOngoing = status.toLowerCase().includes("ongoing");
    const badgeColor = isOngoing ? "bg-purple-600" : "bg-green-600";
    statusBadge = `<div class="absolute top-2 right-2 ${badgeColor} px-2 py-1 text-[9px] font-bold text-white rounded shadow-md z-10">${status}</div>`;
  }

  container.innerHTML += `
    <a href="detail.html?slug=${slug}" class="block group relative animate-fade-in">
        <div class="relative bg-slate-800 rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-lg border border-slate-700 aspect-[2/3]">
            <div class="absolute top-2 left-2 bg-slate-900 px-2 py-1 text-[10px] font-bold text-white rounded border border-slate-700 shadow-md z-10">${info}</div>
            ${statusBadge}
            <img src="${poster}" class="w-full h-full object-cover group-hover:opacity-90 transition" alt="${anime.title}">
            <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-3 pt-10">
                <h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400 transition-colors">${anime.title}</h3>
            </div>
        </div>
    </a>`;
}

// 4. HELPER UTILS
if (genreFilter) {
  genreFilter.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = globalGenreList.filter((g) =>
      g.title.toLowerCase().includes(term),
    );
    renderGenres(filtered);
  });
}

function extractAnimeList(json) {
  if (!json) return [];
  if (json.data && Array.isArray(json.data.animeList))
    return json.data.animeList;
  if (json.data && Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.animeList)) return json.animeList;
  return [];
}

function getIconForGenre(name) {
  const n = name.toLowerCase();
  // Action & Adventure
  if (n.includes("action")) return "⚔️";
  if (n.includes("adventure")) return "🗺️";
  if (n.includes("martial")) return "🥋";
  if (n.includes("samurai")) return "🤺";
  if (n.includes("super power") || n.includes("superpower")) return "⚡";

  // Comedy & Slice of Life
  if (n.includes("comedy")) return "🤣";
  if (n.includes("slice of life") || n.includes("slice")) return "🍃";
  if (n.includes("parody")) return "🤡";

  // Romance & Drama
  if (n.includes("romance")) return "💖";
  if (n.includes("love")) return "💌";
  if (n.includes("drama")) return "🎭";
  if (n.includes("shoujo")) return "🌸";
  if (n.includes("shounen")) return "🔥";
  if (n.includes("josei")) return "💄";
  if (n.includes("seinen")) return "🚬";
  if (n.includes("harem")) return "👯‍♂️";

  // Fantasy & Supernatural
  if (n.includes("fantasy")) return "🧙‍♂️";
  if (n.includes("magic")) return "✨";
  if (n.includes("isekai")) return "🌀";
  if (n.includes("supernatural")) return "👻";
  if (n.includes("demon")) return "👹";
  if (n.includes("vampire")) return "🧛";

  // Sci-Fi & Mecha
  if (n.includes("sci-fi") || n.includes("sci")) return "🚀";
  if (n.includes("mecha")) return "🤖";
  if (n.includes("space")) return "🌌";

  // Mystery, Horror, Thriller
  if (n.includes("mystery")) return "🕵️‍♂️";
  if (n.includes("horror")) return "🧟";
  if (n.includes("thriller")) return "🔪";
  if (n.includes("psychological")) return "🧠";
  if (n.includes("police")) return "👮";

  // School & Sports
  if (n.includes("school")) return "🏫";
  if (n.includes("sports") || n.includes("sport")) return "⚽";
  if (n.includes("cars")) return "🏎️";

  // Music & Arts
  if (n.includes("music")) return "🎵";
  if (n.includes("idol")) return "🎤";

  // Others
  if (n.includes("game")) return "🎮";
  if (n.includes("military")) return "🎖️";
  if (n.includes("historical")) return "📜";
  if (n.includes("kids")) return "👶";
  if (n.includes("food") || n.includes("gourmet")) return "🍖";
  if (n.includes("ecchi")) return "💋";

  return "📺";
}

loadGenres();
