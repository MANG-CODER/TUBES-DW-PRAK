const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

if (!slug) {
  alert("Anime tidak ditemukan!");
  window.location.href = "index.html";
}

const API_DETAIL = `https://www.sankavollerei.com/anime/anime/${slug}`;

/* ============================
   ✅ CACHE SYSTEM (30 MENIT)
============================ */
function setCache(key, data) {
  const cache = {
    timestamp: Date.now(),
    data: data,
  };
  localStorage.setItem(key, JSON.stringify(cache));
}

function getCache(key, maxAge = 1000 * 60 * 30) {
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  const parsed = JSON.parse(cached);
  if (Date.now() - parsed.timestamp > maxAge) return null;

  return parsed.data;
}

/* ============================
   ✅ LOAD DETAIL
============================ */
async function loadDetail() {
  const cacheKey = `detail-${slug}`;
  const cachedData = getCache(cacheKey);

  try {
    if (cachedData) {
      renderDetail(cachedData);
      return;
    }

    const res = await fetch(API_DETAIL);
    const json = await res.json();

    console.log("FULL API RESPONSE:", json); // ✅ DEBUG

    const anime = json.data; // ✅ SESUAI JSON KAMU

    setCache(cacheKey, anime);
    renderDetail(anime);
  } catch (err) {
    console.error("DETAIL ERROR:", err);
    alert("Gagal memuat detail anime!");
  }
}

/* ============================
   ✅ RENDER DETAIL
============================ */
function renderDetail(anime) {
  // ✅ DATA UTAMA
  document.getElementById("detailCover").src = anime.poster;
  document.getElementById("detailTitle").textContent = anime.title;
  document.getElementById("detailDesc").textContent = anime.synopsis;

  document.getElementById("detailStatus").textContent = anime.status;
  document.getElementById("detailStudio").textContent = anime.studio;
  document.getElementById("detailSeason").textContent = anime.release_date;
  document.getElementById("detailEpisode").textContent = anime.episode_count;
  document.getElementById("detailDuration").textContent = anime.duration;
  document.getElementById("detailRating").textContent = anime.rating;

  document.getElementById("detailWatch").href =
    anime.batch?.otakudesu_url || "#";

  /* ============================
     ✅ GENRE
  ============================ */
  const genreBox = document.getElementById("detailGenres");
  genreBox.innerHTML = "";

  anime.genres.forEach((g) => {
    const span = document.createElement("span");
    span.className = "px-3 py-1 bg-white/10 rounded-full text-xs";
    span.textContent = g.name;
    genreBox.appendChild(span);
  });

  /* ============================
     ✅ ✅ EPISODE LIST (FIX SESUAI JSON)
  ============================ */
  const episodeBox = document.getElementById("episodeList");
  episodeBox.innerHTML = "";

  console.log("EPISODE LIST:", anime.episode_lists); // ✅ DEBUG

  if (anime.episode_lists && anime.episode_lists.length > 0) {
    anime.episode_lists.forEach((ep) => {
      episodeBox.innerHTML += `
        <a href="${ep.otakudesu_url}"
           target="_blank"
           class="block p-4 rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/10">
          
          <p class="font-semibold text-sm">
            Episode ${ep.episode_number}
          </p>

          <p class="text-xs text-gray-400 mt-1">
            ${ep.episode}
          </p>
        </a>
      `;
    });
  } else {
    episodeBox.innerHTML = `
      <p class="text-sm text-gray-400 italic">
        Episode tidak tersedia.
      </p>
    `;
  }
}

loadDetail();
