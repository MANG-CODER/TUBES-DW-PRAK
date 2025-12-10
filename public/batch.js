// ==========================================
// 1. INISIALISASI
// ==========================================
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

// Kita butuh 2 Endpoint
const ANIME_API = "https://www.sankavollerei.com/anime/anime/"; // Untuk cari ID Batch
const BATCH_API = "https://www.sankavollerei.com/anime/batch/"; // Untuk cari Link Download

// DOM Elements
const poster = document.getElementById("animePoster");
const title = document.getElementById("animeTitle");
const episodes = document.getElementById("animeEpisodes");
const status = document.getElementById("animeStatus");
const genreList = document.getElementById("genreList");
const downloadContainer = document.getElementById("downloadContainer");

// ==========================================
// 2. SISTEM CACHE
// ==========================================
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}

function getCache(key, maxAge = 1000 * 60 * 30) {
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.time < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// ==========================================
// 3. FETCH FLOW (LOGIKA BARU)
// ==========================================
async function loadBatchInfo() {
  if (!slug) return showError("Slug tidak ditemukan");

  // --- LANGKAH 1: Cari Info Anime & ID Batch ---
  // Cek apakah data anime sudah ada di cache detail?
  const animeKey = `detail-${slug}`;
  let animeData = getCache(animeKey);

  if (!animeData) {
    try {
      console.log(`🔍 Fetching Anime Info: ${ANIME_API}${slug}`);
      const res = await fetch(`${ANIME_API}${slug}`);
      const json = await res.json();

      // Normalisasi Data
      if (json.data && json.data.title) animeData = json.data;
      else if (json.title) animeData = json;
      else if (json.data && json.data.data) animeData = json.data.data;

      if (animeData) setCache(animeKey, animeData);
    } catch (e) {
      console.error(e);
      return showError("Gagal memuat info anime.");
    }
  }

  if (!animeData) return showError("Data Anime tidak ditemukan.");

  // Render Header dulu (Judul, Poster, dll)
  renderHeader(animeData);

  // --- LANGKAH 2: Eksekusi Batch ---
  // Cek apakah anime ini punya properti batch?
  if (animeData.batch && animeData.batch.batchId) {
    // Lanjut fetch ke API Batch menggunakan ID yang benar
    await fetchBatchLinks(animeData.batch.batchId);
  } else {
    showError("Batch belum tersedia untuk anime ini.", "bg-slate-800");
  }
}

async function fetchBatchLinks(batchId) {
  const cacheKey = `batch-links-${batchId}`;
  const cached = getCache(cacheKey);

  if (cached) {
    console.log("⚡ Load Batch Links from Cache");
    renderDownloadList(cached);
    return;
  }

  try {
    console.log(`🚀 Fetching Batch API: ${BATCH_API}${batchId}`);
    const res = await fetch(`${BATCH_API}${batchId}`);

    if (!res.ok) throw new Error("Server Error");

    const json = await res.json();

    // Validasi data
    let batchData = null;
    if (json.data && json.data.downloadUrl) batchData = json.data;
    else if (json.downloadUrl) batchData = json;

    if (batchData) {
      setCache(cacheKey, batchData);
      renderDownloadList(batchData);
    } else {
      showError("Link download kosong atau rusak.");
    }
  } catch (e) {
    console.error(e);
    showError("Gagal mengambil link download (Server Error).");
  }
}

// ==========================================
// 4. RENDER UI
// ==========================================
function renderHeader(anime) {
  if (poster) poster.src = anime.poster || "https://via.placeholder.com/150";
  if (title) title.textContent = anime.title || "No Title";
  if (episodes) episodes.textContent = anime.episodes || "?";
  if (status) status.textContent = "Batch Available";

  if (genreList) {
    genreList.innerHTML = "";
    (anime.genreList || []).forEach((g) => {
      genreList.innerHTML += `
                <span class="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                    ${g.title}
                </span>
            `;
    });
  }
}

function renderDownloadList(batchData) {
  if (!downloadContainer) return;
  downloadContainer.innerHTML = "";

  // Logika Pencari Array Qualities (Fleksibel)
  let formats = [];

  // Pola 1: json.downloadUrl.formats (Sesuai contoh Watanare)
  if (batchData.downloadUrl && Array.isArray(batchData.downloadUrl.formats)) {
    formats = batchData.downloadUrl.formats;
  }
  // Pola 2: json.downloadUrl.qualities
  else if (
    batchData.downloadUrl &&
    Array.isArray(batchData.downloadUrl.qualities)
  ) {
    // Kita bungkus jadi format biar sama strukturnya
    formats = [
      { title: "Batch Download", qualities: batchData.downloadUrl.qualities },
    ];
  }

  if (formats.length === 0) {
    showError("Tidak ada link download ditemukan.");
    return;
  }

  // Loop Formats (Judul Batch)
  formats.forEach((fmt) => {
    // Loop Qualities (360p, 480p, dll)
    if (fmt.qualities) {
      fmt.qualities.forEach((q) => {
        const box = document.createElement("div");
        box.className =
          "bg-slate-900 border border-slate-800 rounded-xl p-5 mb-4 hover:border-purple-500/30 transition shadow-lg";

        const header = document.createElement("div");
        header.className =
          "flex justify-between items-center mb-4 border-b border-slate-800 pb-2";
        header.innerHTML = `
                    <h4 class="text-purple-400 font-bold text-sm uppercase tracking-wider">${
                      q.title
                    }</h4>
                    <span class="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">${
                      q.size || "Unknown Size"
                    }</span>
                `;

        const btnContainer = document.createElement("div");
        btnContainer.className = "flex flex-wrap gap-2";

        if (Array.isArray(q.urls)) {
          q.urls.forEach((link) => {
            const a = document.createElement("a");
            a.href = link.url;
            a.target = "_blank";
            a.className =
              "px-4 py-2 bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 rounded text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-2 group";
            a.innerHTML = `
                            ${link.title}
                            <svg class="w-3 h-3 text-slate-500 group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                        `;
            btnContainer.appendChild(a);
          });
        }

        box.appendChild(header);
        box.appendChild(btnContainer);
        downloadContainer.appendChild(box);
      });
    }
  });
}

function showError(msg, bgClass = "bg-red-900/10") {
  if (!downloadContainer) return;
  downloadContainer.innerHTML = `
        <div class="${bgClass} p-8 rounded-xl border border-slate-700/50 text-center">
            <p class="text-slate-300 font-medium mb-2">${msg}</p>
            <a href="javascript:history.back()" class="text-purple-400 text-sm hover:underline inline-block bg-slate-800 px-4 py-2 rounded-lg mt-2">Kembali</a>
        </div>
    `;
}

// EXECUTE
loadBatchInfo();
