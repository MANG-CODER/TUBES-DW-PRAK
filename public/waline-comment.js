// waline-comment.js
import { init } from "https://unpkg.com/@waline/client@v3/dist/waline.js";

// Fungsi untuk memuat komentar
export function loadComments() {
  // 1. Ambil slug dari URL browser
  const params = new URLSearchParams(window.location.search);
  const currentSlug = params.get("slug");

  init({
    el: "#waline",
    serverURL: "https://mangnimecomments.vercel.app/",

    // 2. Perintah memisahkan komentar berdasarkan slug
    path: currentSlug ? `/anime/${currentSlug}` : window.location.pathname,

    // Konfigurasi lainnya sama
    lang: "id",
    dark: true,
    login: "disable",
    meta: ["nick", "mail"],
    requiredMeta: [],
    search: true,
    reaction: true,
    emoji: [
      "https://unpkg.com/@waline/emojis@1.2.0/bilibili",
      "https://unpkg.com/@waline/emojis@1.2.0/weibo",
    ],
    placeholder: "Tulis komentar kamu di sini...",
  });
}

loadComments();
