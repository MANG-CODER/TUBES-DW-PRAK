const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const EPISODE_API = "https://www.sankavollerei.com/anime/episode/";
const SERVER_API = "https://www.sankavollerei.com/anime/server/";
const episodeTitle = document.getElementById("episodeTitle");
const releaseTime = document.getElementById("releaseTime");
const serverContainer = document.getElementById("serverContainer");
const videoFrame = document.getElementById("videoFrame");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const mobileBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
if (mobileBtn)
  mobileBtn.addEventListener("click", () =>
    mobileMenu.classList.toggle("hidden")
  );

function showLoadingUI(container) {
  if (!container) return;
  container.innerHTML = `<div class="flex flex-col items-center justify-center py-10"><div class="relative flex items-center justify-center w-12 h-12 mb-2"><div class="absolute inset-0 rounded-full border-[3px] border-slate-800 border-t-purple-500 animate-spin"></div><div class="relative bg-slate-900 rounded-full p-2"><img src="./img/Icon MangNime.png" class="w-4 h-4 object-contain animate-pulse"></div></div><p class="text-slate-500 text-xs animate-pulse">Memuat Server...</p></div>`;
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
  } catch (e) {}
}
function getCache(key, maxAge = 1000 * 60 * 30) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (Date.now() - parsed.time > maxAge) return null;
    return parsed.data;
  } catch (e) {
    return null;
  }
}

async function loadEpisode() {
  if (!slug) {
    alert("Episode tidak ditemukan!");
    return;
  }
  const cacheKey = `watch-${slug}`;
  const cachedData = getCache(cacheKey);

  // 1. CEK CACHE
  if (cachedData) {
    console.log("Load Watch Data from Cache");
    renderPage(cachedData);
    return;
  }

  // 2. LOADING
  showLoadingUI(serverContainer);

  try {
    const res = await fetch(EPISODE_API + slug);
    const json = await res.json();
    if (!json.status || !json.data) throw new Error("Data Invalid");
    const data = json.data;
    setCache(cacheKey, data);
    renderPage(data);
  } catch (err) {
    console.error(err);
    episodeTitle.textContent = "Gagal memuat episode.";
    serverContainer.innerHTML = `<p class="text-red-500">Gagal koneksi ke API.</p>`;
  }
}

function renderPage(data) {
  episodeTitle.textContent = data.title;
  releaseTime.textContent = data.releaseTime || "Available";
  if (data.defaultStreamingUrl) videoFrame.src = data.defaultStreamingUrl;
  setupNavigation(data);
  renderServerList(data.server.qualities);
}

function renderServerList(qualities) {
  serverContainer.innerHTML = "";
  if (!qualities || qualities.length === 0) {
    serverContainer.innerHTML = `<p class="text-slate-500 italic">Tidak ada server tambahan.</p>`;
    return;
  }
  qualities.forEach((quality) => {
    const qualityBox = document.createElement("div");
    qualityBox.className = "border-b border-slate-800 pb-4 last:border-0";
    const title = document.createElement("h3");
    title.className =
      "text-purple-400 font-bold text-xs mb-3 uppercase tracking-wider";
    title.textContent = quality.title;
    const btnWrapper = document.createElement("div");
    btnWrapper.className = "flex flex-wrap gap-2";
    quality.serverList.forEach((srv) => {
      const btn = document.createElement("button");
      btn.className =
        "px-4 py-2 bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 rounded text-xs transition text-slate-300 hover:text-white";
      btn.textContent = srv.title;
      btn.onclick = () => {
        document.querySelectorAll("#serverContainer button").forEach((b) => {
          b.classList.remove(
            "bg-purple-600",
            "border-purple-500",
            "text-white"
          );
          b.classList.add("bg-slate-800", "text-slate-300");
        });
        btn.classList.remove("bg-slate-800", "text-slate-300");
        btn.classList.add("bg-purple-600", "border-purple-500", "text-white");
        loadStreamUrl(srv.serverId);
      };
      btnWrapper.appendChild(btn);
    });
    qualityBox.appendChild(title);
    qualityBox.appendChild(btnWrapper);
    serverContainer.appendChild(qualityBox);
  });
}

async function loadStreamUrl(serverId) {
  videoFrame.src = "";
  try {
    const res = await fetch(SERVER_API + serverId);
    const json = await res.json();
    if (json.status && json.data && json.data.url)
      videoFrame.src = json.data.url;
    else alert("Link server ini rusak/kadaluarsa.");
  } catch (err) {
    console.error(err);
    alert("Gagal mengambil link streaming.");
  }
}

function setupNavigation(data) {
  if (data.hasPrevEpisode && data.prevEpisode) {
    btnPrev.href = `watch.html?slug=${data.prevEpisode.episodeId}`;
    btnPrev.classList.remove("hidden");
    btnPrev.classList.add("flex");
  } else btnPrev.classList.add("hidden");
  if (data.hasNextEpisode && data.nextEpisode) {
    btnNext.href = `watch.html?slug=${data.nextEpisode.episodeId}`;
    btnNext.classList.remove("hidden");
    btnNext.classList.add("flex");
  } else btnNext.classList.add("hidden");
}

loadEpisode();
