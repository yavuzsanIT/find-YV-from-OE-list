// src/config.ts
const url = new URL(window.location.href);
export const API_URL =
    url.searchParams.get("api") ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:10000/api"; // fallback (optional)

console.log(`[ENV: ${import.meta.env.MODE}] Using API: ${API_URL}`);
