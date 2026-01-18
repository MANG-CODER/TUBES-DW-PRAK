// ==========================
// SETUP VARIABEL
// ==========================
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const DETAIL_API = "https://www.sankavollerei.com/anime/anime/";
const SEARCH_API = "https://www.sankavollerei.com/anime/search/";

// Elemen DOM Halaman Detail
const poster = document.getElementById("animePoster");
const title = document.getElementById("animeTitle");
const status = document.getElementById("animeStatus");
const studio = document.getElementById("animeStudios");
const aired = document.getElementById("animeAired");
const synopsis = document.getElementById("animeSynopsis");
const episode = document.getElementById("animeEpisodes");
const duration = document.getElementById("animeDuration");
const score = document.getElementById("animeScore");
const genreList = document.getElementById("genreList");
const watchBtn = document.getElementById("detailWatch");
const episodeList = document.getElementById("episodeList");
const batchBox = document.getElementById("batchBox");
const recommendedList = document.getElementById("recommendedList");

// Elemen Navigasi Mobile
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// 1. NAVIGASI MOBILE
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });
}

// ==========================
// 2. LOGIKA SEARCH (REUSABLE DESKTOP & MOBILE)
// ==========================

// A. Init Search
function initSearch(inputId, dropdownId) {
  const inputEl = document.getElementById(inputId);
  const dropdownEl = document.getElementById(dropdownId);
  let searchTimeout = null;

  if (!inputEl || !dropdownEl) return;

  inputEl.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    // 1. Jika kosong, sembunyikan dropdown
    if (query.length === 0) {
      dropdownEl.classList.add("hidden");
      return;
    }

    // 2. Tampilkan Dropdown Loading
    dropdownEl.classList.remove("hidden");
    renderLoadingSearch(dropdownEl, query);

    // 3. Debounce
    searchTimeout = setTimeout(() => {
      performSearch(query, dropdownEl);
    }, 800);
  });

  // Hide klik luar
  document.addEventListener("click", (e) => {
    if (!inputEl.contains(e.target) && !dropdownEl.contains(e.target)) {
      dropdownEl.classList.add("hidden");
    }
  });
}

// Aktifkan Search
initSearch("searchInput", "searchResultsDropdown");
initSearch("mobileSearchInput", "mobileSearchResultsDropdown");

// B. Render Loading
function renderLoadingSearch(container, query) {
  container.innerHTML = `
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

// C. Fetch Search API
async function performSearch(query, container) {
  if (query.length < 3) return;
  try {
    const res = await fetch(`${SEARCH_API}${query}`);
    const json = await res.json();

    // Extract List Helper
    let list = [];
    if (json.data && Array.isArray(json.data.animeList))
      list = json.data.animeList;
    else if (Array.isArray(json.animeList)) list = json.animeList;
    else if (json.data && Array.isArray(json.data)) list = json.data;

    renderDropdownResults(list, query, container);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="p-4 text-center text-red-400 text-xs">Gagal memuat data.</div>`;
  }
}

// D. Render Hasil Dropdown
function renderDropdownResults(list, query, container) {
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
    // Tampilkan Max 50
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

  // NOTE: Di halaman detail, kita HANYA dropdown. Tidak ada fungsi ganti halaman utama.
  // Jadi tombol 'Lihat Semua' bisa diarahkan ke halaman pencarian khusus (jika ada) atau disembunyikan.
  // Disini saya hilangkan tombol 'Lihat Semua' agar sesuai permintaan "hanya dropdown saja".

  container.innerHTML = htmlContent;
}

// ==========================
// 3. FUNGSI UTAMA HALAMAN DETAIL
// ==========================

// Helper UI Loading Detail
function showLoadingUI(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="col-span-full flex flex-col items-center justify-center py-10">
        <div class="relative flex items-center justify-center w-12 h-12 mb-2">
            <div class="absolute inset-0 rounded-full border-[3px] border-slate-800 border-t-purple-500 animate-spin"></div>
            <div class="relative bg-slate-900 rounded-full p-2">
                <img src="./img/Icon MangNime.png" class="w-4 h-4 object-contain animate-pulse">
            </div>
        </div>
        <p class="text-slate-500 text-xs animate-pulse">Memuat...</p>
    </div>`;
}

// Cache System
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}
function getCache(key, maxAge = 1000 * 60 * 20) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.time < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// Fetch Anime Detail
async function getAnimeDetail() {
  if (!slug) return;
  const cacheKey = `detail-${slug}`;
  const cached = getCache(cacheKey);

  if (cached) {
    console.log("Load from Cache");
    renderDetail(cached);
    return;
  }

  if (episodeList) showLoadingUI(episodeList);
  if (recommendedList) showLoadingUI(recommendedList);

  try {
    const res = await fetch(`${DETAIL_API}${slug}`);
    const json = await res.json();
    let animeData = null;
    if (json.data && json.data.title) animeData = json.data;
    else if (json.title) animeData = json;
    else if (json.data && json.data.data && json.data.data.title)
      animeData = json.data.data;

    if (!animeData) {
      document.querySelector("main").innerHTML =
        `<div class="text-center py-20 text-red-400">Data Tidak Ditemukan</div>`;
      return;
    }

    setCache(cacheKey, animeData);
    renderDetail(animeData);
  } catch (err) {
    console.error("DETAIL ERROR:", err);
    document.querySelector("main").innerHTML =
      `<p class="text-center py-10 text-red-500">Terjadi Kesalahan Koneksi.</p>`;
  }
}

// Render UI Detail
function renderDetail(anime) {
  if (poster)
    poster.src =
      anime.poster || "https://via.placeholder.com/300x400?text=No+Image";
  if (title) title.textContent = anime.title || "No Title";
  if (status) status.textContent = anime.status || "-";
  if (studio) studio.textContent = anime.studios || "-";
  if (aired) aired.textContent = anime.aired || "-";
  if (episode) episode.textContent = anime.episodes || "?";
  if (score) score.textContent = anime.score || "N/A";
  if (duration) duration.textContent = anime.duration || "-";

  if (synopsis) {
    if (
      anime.synopsis &&
      Array.isArray(anime.synopsis.paragraphs) &&
      anime.synopsis.paragraphs.length > 0
    ) {
      synopsis.innerHTML = anime.synopsis.paragraphs
        .map((p) => `<p class="mb-2">${p}</p>`)
        .join("");
    } else {
      synopsis.innerHTML =
        "<span class='italic opacity-50'>Sinopsis belum tersedia.</span>";
    }
  }

  const safeGenres = Array.isArray(anime.genreList) ? anime.genreList : [];
  if (genreList) {
    genreList.innerHTML = "";
    safeGenres.forEach((g) => {
      genreList.innerHTML += `<span class="px-3 py-1 text-xs rounded-full bg-purple-700/30 text-purple-300 border border-purple-500/30">${g.title}</span>`;
    });
  }

  const safeEpisodes = Array.isArray(anime.episodeList)
    ? anime.episodeList
    : [];
  if (watchBtn) {
    if (safeEpisodes.length > 0 && safeEpisodes[0].episodeId) {
      watchBtn.href = `watch.html?slug=${safeEpisodes[0].episodeId}`;
      watchBtn.classList.remove(
        "hidden",
        "opacity-50",
        "cursor-not-allowed",
        "bg-slate-700",
      );
      watchBtn.classList.add(
        "bg-gradient-to-r",
        "from-purple-600",
        "to-indigo-600",
      );
      watchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg> Tonton Sekarang`;
    } else {
      watchBtn.classList.add(
        "opacity-50",
        "cursor-not-allowed",
        "bg-slate-700",
      );
      watchBtn.textContent = "Belum Tersedia";
    }
  }

  if (episodeList) {
    episodeList.innerHTML = "";
    if (safeEpisodes.length > 0) {
      safeEpisodes.forEach((ep) => {
        const epTitle = ep.title
          ? ep.title
              .replace(anime.title, "")
              .replace("Subtitle Indonesia", "")
              .trim()
          : `Episode ${ep.eps}`;
        const epId = ep.episodeId || "#";
        episodeList.innerHTML += `<a href="${epId !== "#" ? "watch.html?slug=" + epId : "#"}" class="bg-slate-800 hover:bg-purple-600 border border-slate-700 p-3 rounded-lg transition text-center group flex flex-col justify-center h-full ${epId === "#" ? "pointer-events-none opacity-50" : ""}"><p class="text-sm font-semibold text-gray-300 group-hover:text-white line-clamp-2">${epTitle}</p><p class="text-[10px] text-gray-500 group-hover:text-purple-200 mt-1">${ep.date || ""}</p></a>`;
      });
    } else {
      episodeList.innerHTML = `<div class="col-span-full text-center p-6 bg-slate-900 rounded-lg text-gray-400 italic">Belum ada episode.</div>`;
    }
  }

  const safeBatch = anime.batch ? anime.batch : null;
  if (batchBox) {
    if (safeBatch && safeBatch.otakudesuUrl) {
      batchBox.innerHTML = `<a href="batch.html?slug=${slug}" class="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg shadow-green-900/20">⬇ Download Batch Lengkap</a>`;
    } else {
      batchBox.innerHTML = `<div class="p-4 bg-slate-900 rounded-lg text-center text-gray-500 italic border border-slate-800">Link Batch belum tersedia</div>`;
    }
  }

  const safeRecs = Array.isArray(anime.recommendedAnimeList)
    ? anime.recommendedAnimeList
    : [];
  if (recommendedList) {
    recommendedList.innerHTML = "";
    if (safeRecs.length > 0) {
      safeRecs.forEach((rec) => {
        recommendedList.innerHTML += `<a href="detail.html?slug=${rec.animeId}" class="block group"><div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition shadow-lg border border-slate-800"><img src="${rec.poster || "https://via.placeholder.com/300x400"}" class="w-full h-48 object-cover"><div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-2 pt-6"><h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400">${rec.title}</h3></div></div></a>`;
      });
    } else {
      recommendedList.innerHTML = `<div class="col-span-full text-center text-gray-500 text-sm">Tidak ada rekomendasi.</div>`;
    }
  }
}

// Jalankan Fungsi Utama
getAnimeDetail();
