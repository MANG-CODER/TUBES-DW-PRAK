// ==========================================
// 1. INISIALISASI & KONSTANTA
// ==========================================
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

const DETAIL_API = "https://www.sankavollerei.com/anime/anime/";

// DOM ELEMENTS
const poster = document.getElementById("animePoster");
const title = document.getElementById("animeTitle");
const status = document.getElementById("animeStatus");
const studio = document.getElementById("animeStudios");
const aired = document.getElementById("animeAired");
const episode = document.getElementById("animeEpisodes");
const duration = document.getElementById("animeDuration");
const score = document.getElementById("animeScore");
const genreList = document.getElementById("genreList");
const watchBtn = document.getElementById("detailWatch");

const episodeList = document.getElementById("episodeList");
const batchBox = document.getElementById("batchBox");
const recommendedList = document.getElementById("recommendedList");

// ==========================================
// 2. SISTEM CACHE
// ==========================================
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {
    console.warn("Cache Full");
  }
}

function getCache(key, maxAge = 1000 * 60 * 20) {
  // 20 Menit
  const cache = localStorage.getItem(key);
  if (!cache) return null;
  const parsed = JSON.parse(cache);
  if (Date.now() - parsed.time > maxAge) return null;
  return parsed.data;
}

// ==========================================
// 3. FETCH DETAIL
// ==========================================
async function getAnimeDetail() {
  if (!slug) return;

  const cacheKey = `detail-${slug}`;
  const cached = getCache(cacheKey);

  if (cached) {
    console.log("Load from Cache");
    renderDetail(cached);
    return;
  }

  try {
    const res = await fetch(`${DETAIL_API}${slug}`);
    const json = await res.json();

    // --- LOGIKA PENCARI DATA OTOMATIS ---
    let animeData = null;

    if (json.data && json.data.title) {
      animeData = json.data;
    } else if (json.title) {
      animeData = json;
    } else if (json.data && json.data.data && json.data.data.title) {
      animeData = json.data.data;
    }

    if (!animeData) {
      document.querySelector("main").innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
            <h2 class="text-xl font-bold text-red-400">Data Tidak Ditemukan</h2>
            <p class="text-gray-400">Struktur API tidak sesuai atau anime dihapus.</p>
            <a href="index.html" class="px-4 py-2 bg-slate-800 rounded hover:bg-slate-700 transition">Kembali ke Home</a>
        </div>
      `;
      return;
    }

    setCache(cacheKey, animeData);
    renderDetail(animeData);
  } catch (err) {
    console.error("DETAIL ERROR:", err);
    document.querySelector(
      "main"
    ).innerHTML = `<p class="text-center py-10 text-red-500">Terjadi Kesalahan Koneksi.</p>`;
  }
}

// ==========================================
// 4. RENDER UI (SAFE MODE ✅)
// ==========================================
function renderDetail(anime) {
  // --- INFO UTAMA ---
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

  // --- GENRE ---
  const safeGenres = Array.isArray(anime.genreList) ? anime.genreList : [];
  if (genreList) {
    genreList.innerHTML = "";
    if (safeGenres.length > 0) {
      safeGenres.forEach((g) => {
        genreList.innerHTML += `
              <span class="px-3 py-1 text-xs rounded-full bg-purple-700/30 text-purple-300 border border-purple-500/30">
                ${g.title}
              </span>
            `;
      });
    }
  }

  // --- TOMBOL TONTON ---
  const safeEpisodes = Array.isArray(anime.episodeList)
    ? anime.episodeList
    : [];
  if (watchBtn) {
    if (safeEpisodes.length > 0 && safeEpisodes[0].episodeId) {
      watchBtn.href = `watch.html?slug=${safeEpisodes[0].episodeId}`;
      watchBtn.style.display = "inline-flex";
      watchBtn.classList.remove(
        "opacity-50",
        "cursor-not-allowed",
        "bg-slate-700"
      );
      watchBtn.classList.add(
        "bg-gradient-to-r",
        "from-purple-600",
        "to-indigo-600"
      );
      watchBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg> Tonton Sekarang`;
    } else {
      watchBtn.style.display = "inline-flex";
      watchBtn.classList.add(
        "opacity-50",
        "cursor-not-allowed",
        "bg-slate-700"
      );
      watchBtn.classList.remove(
        "bg-gradient-to-r",
        "from-purple-600",
        "to-indigo-600"
      );
      watchBtn.href = "#";
      watchBtn.textContent = "Belum Tersedia";
    }
  }

  // --- LIST EPISODE ---
  if (episodeList) {
    episodeList.innerHTML = "";
    if (safeEpisodes.length > 0) {
      const episodesToRender = [...safeEpisodes];

      episodesToRender.forEach((ep) => {
        const epTitle = ep.title
          ? ep.title
              .replace(anime.title, "")
              .replace("Subtitle Indonesia", "")
              .trim()
          : `Episode ${ep.eps}`;
        const epId = ep.episodeId || "#";

        episodeList.innerHTML += `
              <a href="${epId !== "#" ? "watch.html?slug=" + epId : "#"}"
                 class="bg-slate-800 hover:bg-purple-600 border border-slate-700 p-3 rounded-lg transition text-center group flex flex-col justify-center h-full ${
                   epId === "#" ? "pointer-events-none opacity-50" : ""
                 }">
                 <p class="text-sm font-semibold text-gray-300 group-hover:text-white line-clamp-2">
                    ${epTitle} 
                 </p>
                 <p class="text-[10px] text-gray-500 group-hover:text-purple-200 mt-1">${
                   ep.date || ""
                 }</p>
              </a>
            `;
      });
    } else {
      episodeList.innerHTML = `<div class="col-span-full text-center p-6 bg-slate-900 rounded-lg text-gray-400 italic">Belum ada episode yang diunggah.</div>`;
    }
  }

  // --- BATCH ---
  const safeBatch = anime.batch ? anime.batch : null;
  if (batchBox) {
    if (safeBatch && safeBatch.otakudesuUrl) {
      // Arahkan ke halaman batch.html kita sendiri
      batchBox.innerHTML = `
            <a href="batch.html?slug=${slug}" 
              class="w-full block text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg shadow-green-900/20">
              ⬇ Download Batch Lengkap
            </a>
          `;
    } else {
      batchBox.innerHTML = `<div class="p-4 bg-slate-900 rounded-lg text-center text-gray-500 italic border border-slate-800">Link Batch belum tersedia</div>`;
    }
  }

  // --- REKOMENDASI ---
  const safeRecs = Array.isArray(anime.recommendedAnimeList)
    ? anime.recommendedAnimeList
    : [];
  if (recommendedList) {
    recommendedList.innerHTML = "";
    if (safeRecs.length > 0) {
      safeRecs.forEach((rec) => {
        recommendedList.innerHTML += `
              <a href="detail.html?slug=${rec.animeId}" class="block group">
                <div class="relative bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition shadow-lg border border-slate-800">
                  <img src="${
                    rec.poster || "https://via.placeholder.com/300x400"
                  }" class="w-full h-48 object-cover">
                  <div class="absolute bottom-0 w-full bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent p-2 pt-6">
                    <h3 class="text-xs font-bold text-white line-clamp-2 group-hover:text-purple-400">
                      ${rec.title}
                    </h3>
                  </div>
                </div>
              </a>
            `;
      });
    } else {
      recommendedList.innerHTML = `<div class="col-span-full text-center text-gray-500 text-sm">Tidak ada rekomendasi.</div>`;
    }
  }
}

// EXECUTE
getAnimeDetail();
