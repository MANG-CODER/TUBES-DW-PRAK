const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

const EPISODE_API = "https://www.sankavollerei.com/anime/episode/";
const SERVER_API  = "https://www.sankavollerei.com/anime/server/";

const episodeTitle = document.getElementById("episodeTitle");
const episodeDate = document.getElementById("episodeDate");
const serverList = document.getElementById("serverList");

const videoContainer = document.getElementById("videoContainer");
const videoFrame = document.getElementById("videoFrame");

// ==========================
// LOAD EPISODE
// ==========================
async function loadEpisode() {
  try {
    const res = await fetch(EPISODE_API + slug);
    const json = await res.json();
    const ep = json.data;

    episodeTitle.textContent = ep.title;
    episodeDate.textContent = ep.uploaded_on;

    serverList.innerHTML = "";
    videoContainer.classList.add("hidden");
    videoFrame.src = "";

    ep.servers.forEach((srv) => {
      const btn = document.createElement("button");
      btn.className =
        "px-4 py-2 bg-purple-600 rounded-md hover:bg-purple-700 text-sm";
      btn.textContent = srv.server_name;

      btn.onclick = () => loadServer(srv.server_id);

      serverList.appendChild(btn);
    });

  } catch (err) {
    console.error("Episode Error:", err);
    episodeTitle.textContent = "Gagal memuat episode.";
  }
}

// ==========================
// LOAD SERVER (setelah dipilih)
// ==========================
async function loadServer(serverId) {
  try {
    videoContainer.classList.remove("hidden");
    videoFrame.src = "";

    const res = await fetch(SERVER_API + serverId);
    const json = await res.json();

    videoFrame.src = json.data.url;

  } catch (err) {
    console.error("Server Error:", err);
    alert("Gagal memuat server.");
  }
}

loadEpisode();
