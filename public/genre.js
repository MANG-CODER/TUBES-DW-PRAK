// ==========================================
// 1. INIT
// ==========================================
const GENRE_API = "https://www.sankavollerei.com/anime/genre";
const genreContainer = document.getElementById("genreContainer");
const genreFilter = document.getElementById("genreFilter");
const searchInput = document.getElementById("searchInput"); // Nav Search

// Array warna untuk variasi card
const colors = [
  "hover:border-purple-500 hover:shadow-purple-500/20 text-purple-400",
  "hover:border-blue-500 hover:shadow-blue-500/20 text-blue-400",
  "hover:border-green-500 hover:shadow-green-500/20 text-green-400",
  "hover:border-pink-500 hover:shadow-pink-500/20 text-pink-400",
  "hover:border-yellow-500 hover:shadow-yellow-500/20 text-yellow-400",
  "hover:border-cyan-500 hover:shadow-cyan-500/20 text-cyan-400",
  "hover:border-red-500 hover:shadow-red-500/20 text-red-400",
];

// ==========================================
// 2. CACHE SYSTEM
// ==========================================
function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}

function getCache(key, maxAge = 1000 * 60 * 60 * 24) {
  // Cache 24 Jam (Genre jarang berubah)
  try {
    const c = JSON.parse(localStorage.getItem(key));
    if (c && Date.now() - c.time < maxAge) return c.data;
  } catch (e) {}
  return null;
}

// ==========================================
// 3. FETCH GENRES
// ==========================================
async function loadGenres() {
  const cacheKey = "genre-list";
  const cached = getCache(cacheKey);

  if (cached) {
    renderGenres(cached);
    setupFilter(cached);
    return;
  }

  try {
    const res = await fetch(GENRE_API);
    const json = await res.json();

    if (json.status === "success" && json.data && json.data.genreList) {
      setCache(cacheKey, json.data.genreList);
      renderGenres(json.data.genreList);
      setupFilter(json.data.genreList);
    } else {
      genreContainer.innerHTML = `<p class="col-span-full text-center text-red-400">Gagal memuat genre.</p>`;
    }
  } catch (e) {
    console.error(e);
    genreContainer.innerHTML = `<p class="col-span-full text-center text-red-400">Terjadi kesalahan koneksi.</p>`;
  }
}

// ==========================================
// 4. RENDER UI
// ==========================================
function renderGenres(list) {
  genreContainer.innerHTML = "";

  if (list.length === 0) {
    genreContainer.innerHTML = `<p class="col-span-full text-center text-slate-500 italic">Genre tidak ditemukan.</p>`;
    return;
  }

  list.forEach((genre, index) => {
    // Pilih warna acak/berurutan dari array
    const colorClass = colors[index % colors.length];

    const card = document.createElement("a");
    // Link ke halaman hasil genre (Kamu perlu buat genre-result.html nanti)
    card.href = `genre-result.html?id=${genre.genreId}`;
    card.className = `group bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 ${colorClass}`;

    card.innerHTML = `
            <div class="mb-3 p-3 rounded-full bg-slate-800 group-hover:bg-slate-700 transition">
                <span class="text-2xl opacity-80 group-hover:opacity-100 transition transform group-hover:scale-110 block">
                    ${getIconForGenre(genre.title)}
                </span>
            </div>
            <h3 class="font-bold text-sm sm:text-base text-slate-200 group-hover:text-white transition">${
              genre.title
            }</h3>
        `;

    genreContainer.appendChild(card);
  });
}

// ==========================================
// 5. FITUR SEARCH FILTER
// ==========================================
function setupFilter(fullList) {
  if (!genreFilter) return;

  genreFilter.addEventListener("keyup", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = fullList.filter((g) =>
      g.title.toLowerCase().includes(term)
    );
    renderGenres(filtered);
  });
}

// ==========================================
// 6. HELPER ICON (Opsional: Agar lebih cantik)
// ==========================================
function getIconForGenre(name) {
  const n = name.toLowerCase();
  if (n.includes("action")) return "⚔️";
  if (n.includes("adventure")) return "🗺️";
  if (n.includes("comedy")) return "🤣";
  if (n.includes("romance")) return "💖";
  if (n.includes("drama")) return "🎭";
  if (n.includes("fantasy")) return "🧚";
  if (n.includes("magic")) return "✨";
  if (n.includes("supernatural")) return "👻";
  if (n.includes("horror")) return "🧟";
  if (n.includes("mystery")) return "🕵️";
  if (n.includes("psychological")) return "🧠";
  if (n.includes("sci-fi")) return "🚀";
  if (n.includes("slice of life")) return "🍰";
  if (n.includes("sports")) return "⚽";
  if (n.includes("music")) return "🎵";
  if (n.includes("mecha")) return "🤖";
  if (n.includes("school")) return "🏫";
  if (n.includes("isekai")) return "🌀";
  if (n.includes("harem")) return "👯";
  return "📺"; // Default
}

// ==========================================
// 7. NAV SEARCH REDIRECT
// ==========================================
if (searchInput) {
  searchInput.addEventListener("keyup", async (e) => {
    if (e.key === "Enter" || e.target.value.length > 3) {
      window.location.href = `ongoing.html?q=${e.target.value}`;
    }
  });
}

// EXECUTE
loadGenres();
