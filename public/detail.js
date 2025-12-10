// === AMBIL SLUG DARI URL ===
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

// === API ===
const DETAIL_API = "https://www.sankavollerei.com/anime/anime/";

// === ELEMENT HTML ===
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

// === CACHE ===
function setCache(key, data) {
  localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
}

function getCache(key, maxAge = 1000 * 60 * 20) {
  const cache = localStorage.getItem(key);
  if (!cache) return null;

  const parsed = JSON.parse(cache);
  if (Date.now() - parsed.time > maxAge) return null;

  return parsed.data;
}

// === FETCH DETAIL ===
async function getAnimeDetail() {
  if (!slug) return;

  const cacheKey = `detail-${slug}`;
  const cached = getCache(cacheKey);

  if (cached) {
    renderDetail(cached);
    return;
  }

  try {
    const res = await fetch(`${DETAIL_API}${slug}`);
    const json = await res.json();

    const anime = json.data;
    setCache(cacheKey, anime);
    renderDetail(anime);
  } catch (err) {
    console.error("DETAIL ERROR:", err);
  }
}

// === RENDER DETAIL ===
function renderDetail(anime) {
  poster.src = anime.poster;
  title.textContent = anime.title;

  status.textContent = anime.status;
  studio.textContent = anime.studios;
  aired.textContent = anime.aired;
  episode.textContent = anime.episodes;
  duration.textContent = anime.duration;
  score.textContent = anime.score;

  // GENRE
  genreList.innerHTML = "";
  anime.genreList.forEach((g) => {
    genreList.innerHTML += `
      <span class="px-3 py-1 text-xs rounded-full bg-purple-700/30 text-purple-300">
        ${g.title}
      </span>
    `;
  });

  // BUTTON TONTON (PAKAI EPISODE TERBARU)
  if (anime.episodeList.length > 0) {
    watchBtn.href = `watch.html?slug=${anime.episodeList[0].slug}`;
  }

  // EPISODE LIST
  episodeList.innerHTML = "";
  anime.episodeList.forEach((ep) => {
    episodeList.innerHTML += `
      <a href="watch.html?slug=${ep.slug}"
         class="bg-slate-900 p-3 rounded-lg hover:bg-purple-700 transition text-center">
         ${ep.title}
      </a>
    `;
  });

  // BATCH DOWNLOAD
  batchBox.innerHTML = `
    <a href="${anime.batch.otakudesuUrl}" target="_blank"
      class="inline-block bg-green-600 px-6 py-3 rounded-lg hover:bg-green-700 transition">
      ⬇ Download Batch
    </a>
  `;

  // REKOMENDASI
  recommendedList.innerHTML = "";
  anime.recommendedAnimeList.forEach((rec) => {
    recommendedList.innerHTML += `
      <a href="detail.html?slug=${rec.animeId}" class="block group">
        <div class="bg-slate-900 rounded-xl overflow-hidden hover:scale-105 transition">
          <img src="${rec.poster}" class="w-full h-48 object-cover">
          <div class="p-2">
            <h3 class="text-sm font-bold line-clamp-2 group-hover:text-purple-400">
              ${rec.title}
            </h3>
          </div>
        </div>
      </a>
    `;
  });
}

// === LOAD DATA ===
getAnimeDetail();
