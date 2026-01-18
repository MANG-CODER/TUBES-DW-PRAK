// waline-comment.js
import { init } from "https://unpkg.com/@waline/client@v3/dist/waline.js";

// Fungsi untuk memuat komentar
export function loadComments() {
  init({
    el: "#waline", // ID dari div di HTML

    serverURL: "https://mangnime-comments.vercel.app/api/waline",

    // Konfigurasi Tampilan MangNime
    lang: "id", // Bahasa Indonesia
    dark: true, // Mode gelap permanen
    login: "disable", // User tidak wajib login
    meta: ["nick", "mail"], // Data yang diminta
    requiredMeta: [], // Tidak ada data yang wajib diisi

    // Fitur Tambahan
    search: true, // pencarian GIF
    reaction: true, // Menyalakan reaksi emoji
    emoji: [
      "https://unpkg.com/@waline/emojis@1.2.0/bilibili",
      "https://unpkg.com/@waline/emojis@1.2.0/weibo",
    ],
    placeholder: "Tulis komentar kamu di sini...",
  });
}

// Jalankan fungsi
loadComments();
