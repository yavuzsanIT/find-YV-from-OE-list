import { API_URL } from "./config";

// ---------- Elements ----------
const dropzone = document.getElementById("dropzone") as HTMLElement;
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const browseBtn = document.getElementById("browseBtn") as HTMLButtonElement;
const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement;
const downloadBtn = document.getElementById("downloadBtn") as HTMLButtonElement;
const clearBtn = document.getElementById("clearBtn") as HTMLButtonElement;
const fileInfo = document.getElementById("fileInfo") as HTMLElement;
const fileNameEl = document.getElementById("fileName") as HTMLElement;
const fileSizeEl = document.getElementById("fileSize") as HTMLElement;
const alertBox = document.getElementById("alert") as HTMLElement;
const progressWrap = document.getElementById("progressWrap") as HTMLElement;
const progressBar = document.getElementById("progressBar") as HTMLProgressElement;
const progressLabel = document.getElementById("progressLabel") as HTMLElement;
const searchKeywordsContainer = document.getElementById("searchKeywords") as HTMLElement;
const addKeywordBtn = document.getElementById("addKeywordBtn") as HTMLButtonElement;

let selectedFile: File | null = null;
let resultFilename: string | null = null;
let searchKeywords: string[] = [""];

// ---------- Helpers ----------
function showAlert(msg: string, type: string = "info") {
  alertBox.textContent = msg;
  alertBox.className = "alert " + type;
  alertBox.classList.remove("hidden");
}

function hideAlert() {
  alertBox.classList.add("hidden");
}

function formatBytes(bytes: number) {
  if (!bytes && bytes !== 0) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
}

function setFile(file: File | null) {
  selectedFile = file;
  if (file) {
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = "• " + formatBytes(file.size);
    fileInfo.classList.remove("hidden");
    uploadBtn.disabled = false;
    downloadBtn.disabled = true;
    resultFilename = null;
  } else {
    fileInfo.classList.add("hidden");
    uploadBtn.disabled = true;
  }
}

function setProgress(val: number, label?: string) {
  progressWrap.classList.remove("hidden");
  progressBar.value = val;
  progressLabel.textContent = label || val + "%";
}

function resetProgress() {
  progressWrap.classList.add("hidden");
  progressBar.value = 0;
  progressLabel.textContent = "Preparing…";
}

function renderKeywordInputs() {
  searchKeywordsContainer.innerHTML = "";

  searchKeywords.forEach((keyword, index) => {
    const inputWrapper = document.createElement("div");
    inputWrapper.className = "input-group keyword-item";
    inputWrapper.innerHTML = `
      <input type="text" class="input-field" placeholder="OE, OEM, TRW vb." value="${keyword}" />
      ${searchKeywords.length > 1 ? '<button type="button" class="btn btn-ghost remove-btn">&times;</button>' : ""}
      <div class="keyword-error hidden"></div>
    `;

    const input = inputWrapper.querySelector("input")!;
    const removeBtn = inputWrapper.querySelector(".remove-btn") as HTMLButtonElement | null;

    input.addEventListener("input", (e) => {
      const value = (e.target as HTMLInputElement).value.trim();
      searchKeywords[index] = value;
      validateKeywordInput(input);
    });

    removeBtn?.addEventListener("click", () => {
      searchKeywords.splice(index, 1);
      renderKeywordInputs();
    });

    searchKeywordsContainer.appendChild(inputWrapper);
  });
}

function validateKeywordInput(inputEl: HTMLInputElement) {
  const value = inputEl.value.trim();
  const errorEl = inputEl.parentElement!.querySelector(".keyword-error") as HTMLElement;

  errorEl.classList.add("hidden");
  inputEl.classList.remove("is-error");

  if (value.length > 0 && value.length < 2) {
    errorEl.textContent = "En az 2 karakter olmalı.";
    errorEl.classList.remove("hidden");
    inputEl.classList.add("is-error");
    return false;
  }

  const currentKeywords = searchKeywords.filter((k) => k.length > 0);
  const isDuplicate = currentKeywords.filter((k) => k === value).length > 1;

  if (isDuplicate) {
    errorEl.textContent = "Bu kelime zaten mevcut.";
    errorEl.classList.remove("hidden");
    inputEl.classList.add("is-error");
    return false;
  }

  return true;
}

// ---------- Event listeners ----------

// Dropzone
["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("is-drag");
  }),
);

["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("is-drag");
  }),
);

dropzone.addEventListener("drop", (e) => {
  const f = e.dataTransfer?.files?.[0];
  if (f) setFile(f);
});

// Browse
browseBtn.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) setFile(f);
});

// Clear
clearBtn.addEventListener("click", () => {
  fileInput.value = "";
  setFile(null);
  hideAlert();
  resetProgress();
});

// Add keyword
addKeywordBtn.addEventListener("click", () => {
  searchKeywords.push("");
  renderKeywordInputs();
});

// Upload
uploadBtn.addEventListener("click", async () => {
  hideAlert();
  if (!selectedFile) {
    showAlert("Lütfen bir dosya seçin.", "error");
    return;
  }

  const allInputs = searchKeywordsContainer.querySelectorAll(".keyword-item input");
  let isValid = true;
  allInputs.forEach((input) => {
    if (!validateKeywordInput(input as HTMLInputElement)) isValid = false;
  });

  if (!isValid) {
    showAlert("Lütfen arama kelimelerindeki hataları düzeltin.", "error");
    return;
  }

  const filteredKeywords = searchKeywords.filter((k) => k.length > 0);
  if (filteredKeywords.length === 0) {
    showAlert("Lütfen en az bir arama kelimesi girin.", "error");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("keywords", filteredKeywords.join(","));

    setProgress(20, "Yükleniyor…");

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Upload failed");
    }

    setProgress(70, "Sunucuda işleniyor…");

    const data = await res.json();
    if (!data?.filename) throw new Error("Invalid response");

    resultFilename = data.filename;
    setProgress(100, "Tamamlandı");
    showAlert("Dosya başarıyla işlendi.", "success");
    downloadBtn.disabled = false;
  } catch (err: any) {
    console.error(err);
    showAlert(err.message || "Beklenmedik bir hata oluştu.", "error");
    resetProgress();
  }
});

// Download
downloadBtn.addEventListener("click", () => {
  if (!resultFilename) return;
  window.location.href = `${API_URL}/download/${encodeURIComponent(resultFilename)}`;
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  renderKeywordInputs();
});
