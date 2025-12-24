// Encapsulate App logic to avoid global scope pollution
const App = (() => {
  // --- STATE & CONFIG ---
  const DEBUG_MODE = new URLSearchParams(window.location.search).has("debug");
  let extensions = [];
  let favorites = JSON.parse(
    localStorage.getItem("tw_gallery_favorites") || "[]"
  );
  let currentCategory = "all";
  let lastFocusedElement = null; // For focus restoration

  // DOM Elements Cache
  const els = {
    grid: document.getElementById("extensionGrid"),
    searchInput: document.getElementById("searchInput"),
    searchClearBtn: document.getElementById("searchClearBtn"),
    sortSelect: document.getElementById("sortSelect"),
    noResults: document.getElementById("noResults"),
    categoryContainer: document.getElementById("categoryContainer"),
    modal: document.getElementById("detailModal"),
    modalTitle: document.getElementById("modalTitle"),
    modalAuthor: document.getElementById("modalAuthor"),
    modalVersion: document.getElementById("modalVersion"),
    modalDesc: document.getElementById("modalDescription"),
    modalIcon: document.getElementById("modalIconContainer"),
    modalBadges: document.getElementById("modalBadges"),
    modalCopyBtn: document.getElementById("modalCopyBtn"),
    modalOpenBtn: document.getElementById("modalOpenBtn"),
    modalDownloadBtn: document.getElementById("modalDownloadBtn"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),
    themeToggle: document.getElementById("themeToggle"),
    toastContainer: document.getElementById("toastContainer"),
    resetFiltersBtn: document.getElementById("resetFiltersBtn"),
  };

  // Mock Data
  const mockExtensions = [
    {
      id: "cursor-utils",
      name: "Advanced Cursor",
      description:
        "Hide, lock, and customize the mouse cursor. Useful for FPS games and custom UI.",
      author: "DevUser",
      version: "1.2.0",
      category: "utilities",
      iconValue: "ph-cursor",
      iconType: "class",
      color: "text-blue-500",
      url: "https://extensions.turbowarp.org/gamepad.js",
      unsandboxed: false,
      isMod: false,
      isNew: false,
      featured: true,
    },
    {
      id: "file-system",
      name: "Local File System",
      description:
        "Read and write text files directly to the user's computer. Requires permission granting.",
      author: "SysAdmin",
      version: "1.1.0",
      category: "utilities",
      iconValue: "ph-hard-drives",
      iconType: "class",
      color: "text-yellow-500",
      url: "https://extensions.turbowarp.org/files.js",
      unsandboxed: true,
      isMod: false,
      isNew: false,
      featured: false,
    },
    {
      id: "gamepad-pro",
      name: "Gamepad Pro",
      description:
        "Extended support for rumble, gyroscope, and specific controller mappings.",
      author: "GamerOne",
      version: "1.0.0",
      category: "hardware",
      iconValue: "ph-game-controller",
      iconType: "class",
      color: "text-red-500",
      url: "https://extensions.turbowarp.org/gamepad.js",
      unsandboxed: false,
      isMod: true,
      isNew: true,
      featured: false,
    },
    {
      id: "web-socket",
      name: "Simple WebSockets",
      description:
        "Connect to standard WebSocket servers to build multiplayer games or chat apps.",
      author: "NetMaster",
      version: "0.9.5",
      category: "network",
      iconValue: "ph-globe",
      iconType: "class",
      color: "text-green-500",
      url: "https://extensions.turbowarp.org/fetch.js",
      unsandboxed: false,
      isMod: false,
      isNew: false,
      featured: false,
    },
    {
      id: "audio-visualizer",
      name: "Audio Visualizer",
      description:
        "Generate frequency data from audio to create music visualizers and effects.",
      author: "AudioWiz",
      version: "2.0.1",
      category: "media",
      iconValue: "ph-wave-sine",
      iconType: "class",
      color: "text-purple-500",
      url: "https://extensions.turbowarp.org/box2d.js",
      unsandboxed: false,
      isMod: false,
      isNew: false,
      featured: true,
    },
  ];

  // --- PUBLIC INIT ---
  async function init() {
    if (DEBUG_MODE) console.group("🚀 TurboWarp Gallery Debug");

    initTheme();
    renderSkeletons();
    await loadData();
    restoreState();
    renderCategories();
    filterAndRender();
    setupEventListeners();
    checkHash();

    if (DEBUG_MODE) console.groupEnd();
  }

  // --- DATA HANDLING ---
  async function loadData() {
    try {
      const response = await fetch("extensions.json");
      if (!response.ok) throw new Error("extensions.json not found");
      const folders = await response.json();

      const loaded = await Promise.all(
        folders.map(async (folder) => {
          try {
            const manifestRes = await fetch(`${folder}/manifest.json`);
            if (!manifestRes.ok) return null;
            const manifest = await manifestRes.json();

            const results = await Promise.allSettled([
              fetch(`${folder}/desc.txt`),
              fetch(`${folder}/icon.svg`),
              fetch(`${folder}/icon.txt`),
            ]);

            const desc =
              results[0].status === "fulfilled" && results[0].value.ok
                ? await results[0].value.text()
                : manifest.description || "";
            const iconSvgOk =
              results[1].status === "fulfilled" && results[1].value.ok;
            const iconTxtOk =
              results[2].status === "fulfilled" && results[2].value.ok;

            const category = normalizeCategory(manifest.category);
            const entry = manifest.entry || "extension.js";
            const url = new URL(`${folder}/${entry}`, window.location.href)
              .href;

            let iconType = "class";
            let iconValue = manifest.icon || "ph-puzzle-piece";

            if (iconSvgOk) {
              iconType = "svg";
              iconValue = new URL(`${folder}/icon.svg`, window.location.href)
                .href;
            } else if (iconTxtOk) {
              const txt = await results[2].value.text();
              iconType = "class";
              iconValue = txt.trim().startsWith("ph-")
                ? txt.trim()
                : `ph-${txt.trim()}`;
            }

            return {
              id: folder,
              name: manifest.name || folder,
              description: desc.trim(),
              author: manifest.author || "Unknown",
              version: manifest.version || "0.0.1",
              category: category,
              iconType,
              iconValue,
              color: manifest.color || "text-turbowarp",
              url: url,
              unsandboxed: !!manifest.unsandboxed,
              isMod: !!(manifest.isMod || manifest.fork),
              isNew: !!manifest.isNew,
              featured: !!manifest.featured,
              searchString:
                `${manifest.name} ${desc} ${manifest.author}`.toLowerCase(),
            };
          } catch (e) {
            return null;
          }
        })
      );

      const valid = loaded.filter((e) => e !== null);
      extensions = valid.length > 0 ? valid : hydrateMockData(mockExtensions);
    } catch (e) {
      extensions = hydrateMockData(mockExtensions);
    }
  }

  function hydrateMockData(data) {
    return data.map((ext) => ({
      ...ext,
      category: normalizeCategory(ext.category),
      searchString:
        `${ext.name} ${ext.description} ${ext.author}`.toLowerCase(),
    }));
  }

  // --- RENDERING ---
  function renderSkeletons() {
    els.grid.innerHTML = Array(6)
      .fill(0)
      .map(
        () => `
            <div class="bg-white dark:bg-cardbg border border-slate-200 dark:border-border rounded-xl p-6 h-48 animate-pulse">
                <div class="flex justify-between mb-4">
                    <div class="w-12 h-12 bg-slate-200 dark:bg-darkbg rounded-lg"></div>
                    <div class="w-16 h-6 bg-slate-200 dark:bg-darkbg rounded"></div>
                </div>
                <div class="w-3/4 h-6 bg-slate-200 dark:bg-darkbg rounded mb-3"></div>
                <div class="w-full h-4 bg-slate-200 dark:bg-darkbg rounded mb-2"></div>
            </div>
        `
      )
      .join("");
  }

  function renderExtensions(list) {
    els.grid.innerHTML = "";

    if (list.length === 0) {
      els.noResults.classList.remove("hidden");
    } else {
      els.noResults.classList.add("hidden");

      list.forEach((ext) => {
        const isFav = favorites.includes(ext.id);
        const article = document.createElement("article");
        article.className = `extension-card bg-white dark:bg-cardbg border border-slate-200 dark:border-border rounded-xl p-6 flex flex-col h-full relative group`;

        const iconEl =
          ext.iconType === "svg"
            ? `<img src="${ext.iconValue}" alt="" class="w-8 h-8 object-contain">`
            : `<i class="ph ${ext.iconValue} ${
                ext.color || "text-slate-500 dark:text-white"
              } text-3xl" aria-hidden="true"></i>`;

        let badgeHTML = "";
        if (ext.featured) {
          badgeHTML += `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 uppercase tracking-wide mr-2">Featured</span>`;
        }
        if (ext.isNew) {
          badgeHTML += `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 uppercase tracking-wide mr-2">New</span>`;
        }
        if (ext.unsandboxed) {
          badgeHTML += `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 uppercase tracking-wide mr-2" title="Unsandboxed">Unsandboxed</span>`;
        }
        if (ext.isMod) {
          badgeHTML += `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 uppercase tracking-wide" title="Mod">Mod</span>`;
        }

        article.innerHTML = `
                    <div class="flex items-start justify-between mb-4">
                        <div class="w-14 h-14 rounded-xl bg-slate-100 dark:bg-darkbg border border-slate-200 dark:border-border flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                            ${iconEl}
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <button 
                                type="button"
                                data-action="toggle-favorite" 
                                data-id="${ext.id}" 
                                aria-label="${
                                  isFav
                                    ? "Remove from favorites"
                                    : "Add to favorites"
                                }"
                                aria-pressed="${isFav}"
                                class="text-xl ${
                                  isFav
                                    ? "text-yellow-400"
                                    : "text-slate-300 dark:text-gray-600"
                                } hover:text-yellow-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-400 rounded-full"
                            >
                                <i class="ph-fill ph-star"></i>
                            </button>
                            <span class="text-xs font-mono text-slate-500 dark:text-gray-500">v${
                              ext.version
                            }</span>
                        </div>
                    </div>
                    
                    <div class="mb-2">
                        <h3>
                            <button 
                                type="button"
                                data-action="open-modal" 
                                data-id="${ext.id}"
                                class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-turbowarp transition-colors text-left w-full focus:outline-none focus:underline"
                            >
                                ${ext.name}
                            </button>
                        </h3>
                        <button 
                            type="button"
                            data-action="filter-author" 
                            data-author="${ext.author}" 
                            class="text-xs text-slate-500 dark:text-gray-400 hover:text-turbowarp hover:underline transition-colors focus:outline-none"
                        >
                            by ${ext.author}
                        </button>
                    </div>
                    
                    <div class="mb-4">${badgeHTML}</div>
                    <p class="text-slate-600 dark:text-gray-400 text-sm mb-6 flex-grow leading-relaxed line-clamp-3">${
                      ext.description
                    }</p>
                    
                    <div class="flex gap-2 mt-auto">
                        <button 
                            type="button"
                            data-action="open-modal" 
                            data-id="${ext.id}"
                            class="flex-1 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-200 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-slate-200 dark:hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-turbowarp"
                        >
                            More Info
                        </button>
                        <a 
                            href="https://turbowarp.org/editor?extension=${encodeURIComponent(
                              ext.url
                            )}" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            class="w-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-darkbg text-slate-400 dark:text-gray-400 hover:text-turbowarp hover:border-turbowarp dark:hover:border-turbowarp transition-colors" 
                            title="Open directly"
                            aria-label="Open in TurboWarp"
                        >
                            <i class="ph ph-arrow-square-out text-lg"></i>
                        </a>
                    </div>
                `;
        els.grid.appendChild(article);
      });
    }
  }

  function renderCategories() {
    const categories = new Set(extensions.map((e) => e.category));
    const sorted = Array.from(categories).sort();
    els.categoryContainer.innerHTML = "";

    const createBtn = (id, label, icon) => {
      const btn = document.createElement("button");
      const isActive = currentCategory === id;
      btn.className = `px-4 py-1.5 rounded-full text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-turbowarp flex items-center gap-2 ${
        isActive
          ? "bg-turbowarp text-white shadow-lg shadow-red-500/20"
          : "bg-white dark:bg-cardbg border border-slate-200 dark:border-border text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
      }`;
      btn.innerHTML = icon ? `<i class="ph ${icon}"></i> ${label}` : label;
      btn.setAttribute("aria-pressed", isActive);
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", isActive);

      btn.addEventListener("click", () => {
        currentCategory = id;
        localStorage.setItem("tw_gallery_category", id);
        renderCategories();
        filterAndRender();
      });
      return btn;
    };

    els.categoryContainer.appendChild(createBtn("all", "All"));
    els.categoryContainer.appendChild(
      createBtn("favorites", "Favorites", "ph-star-fill")
    );

    sorted.forEach((cat) => {
      const label = cat
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      els.categoryContainer.appendChild(createBtn(cat, label));
    });
  }

  // --- FILTER LOGIC ---
  function filterAndRender() {
    const query = els.searchInput.value.toLowerCase().trim();
    els.searchClearBtn.classList.toggle("hidden", query.length === 0);

    const sortMode = els.sortSelect.value;

    const filtered = extensions.filter((ext) => {
      const matchesSearch = !query || ext.searchString.includes(query);
      const matchesCategory =
        currentCategory === "all" ||
        (currentCategory === "favorites" && favorites.includes(ext.id)) ||
        ext.category === currentCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortMode === "random") {
      filtered.sort(() => Math.random() - 0.5);
    } else if (sortMode === "newest") {
      filtered.sort((a, b) => (b.isNew === a.isNew ? 0 : b.isNew ? 1 : -1));
    } else {
      filtered.sort((a, b) => {
        if (sortMode === "name") return a.name.localeCompare(b.name);
        if (sortMode === "author") return a.author.localeCompare(b.author);
        return 0;
      });
    }

    renderExtensions(filtered);
  }

  function filterByAuthor(author) {
    els.searchInput.value = author;
    localStorage.setItem("tw_gallery_search", author);
    filterAndRender();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`Filtered by ${author}`);
  }

  function resetFilters() {
    els.searchInput.value = "";
    currentCategory = "all";
    localStorage.removeItem("tw_gallery_search");
    localStorage.setItem("tw_gallery_category", "all");
    renderCategories();
    filterAndRender();
    els.searchInput.focus();
  }

  // --- INTERACTIONS & EVENTS ---
  function setupEventListeners() {
    els.grid.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;

      const action = btn.dataset.action;
      if (!action) return;

      if (action === "open-modal") openModal(btn.dataset.id);
      if (action === "toggle-favorite") toggleFavorite(btn.dataset.id, btn);
      if (action === "filter-author") filterByAuthor(btn.dataset.author);
    });

    els.searchInput.addEventListener("input", () => {
      localStorage.setItem("tw_gallery_search", els.searchInput.value);
      filterAndRender();
    });
    els.searchClearBtn.addEventListener("click", () => {
      els.searchInput.value = "";
      localStorage.removeItem("tw_gallery_search");
      filterAndRender();
      els.searchInput.focus();
    });
    els.sortSelect.addEventListener("change", filterAndRender);
    els.themeToggle.addEventListener("click", toggleTheme);
    els.resetFiltersBtn.addEventListener("click", resetFilters);

    els.modalCloseBtn.addEventListener("click", closeModal);
    els.modal.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModal();
    });

    els.modal.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        const focusable = els.modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
        if (e.key === "Escape") {
          e.target.blur();
          if (e.target === els.searchInput && els.searchInput.value) {
            resetFilters();
          }
        }
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        els.searchInput.focus();
      }
      if (e.key === "Escape" && els.modal.classList.contains("open")) {
        closeModal();
      }
    });
  }

  function toggleFavorite(id, btn) {
    if (favorites.includes(id)) {
      favorites = favorites.filter((fid) => fid !== id);
      showToast("Removed from Favorites");
    } else {
      favorites.push(id);
      showToast("Added to Favorites");
    }
    localStorage.setItem("tw_gallery_favorites", JSON.stringify(favorites));

    if (currentCategory === "favorites") filterAndRender();
    else {
      const isFav = favorites.includes(id);
      btn.setAttribute("aria-pressed", isFav);
      btn.setAttribute(
        "aria-label",
        isFav ? "Remove from favorites" : "Add to favorites"
      );
      btn.className = `text-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-400 rounded-full ${
        isFav
          ? "text-yellow-400"
          : "text-slate-300 dark:text-gray-600 hover:text-yellow-400"
      }`;
    }
  }

  function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.theme = "light";
    } else {
      html.classList.add("dark");
      localStorage.theme = "dark";
    }
  }

  function initTheme() {
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // --- MODAL LOGIC ---
  function openModal(id) {
    const ext = extensions.find((e) => e.id === id);
    if (!ext) return;

    lastFocusedElement = document.activeElement;
    try {
      history.pushState(null, null, `#${id}`);
    } catch (e) {
      // History API may not be available in some environments
    }

    els.modalTitle.textContent = ext.name;
    els.modalAuthor.textContent = ext.author;
    els.modalAuthor.onclick = () => {
      closeModal();
      filterByAuthor(ext.author);
    };
    els.modalVersion.textContent = `v${ext.version}`;
    els.modalDesc.textContent = ext.description;

    if (ext.iconType === "svg") {
      els.modalIcon.innerHTML = `<img src="${ext.iconValue}" class="w-10 h-10 object-contain">`;
    } else {
      els.modalIcon.innerHTML = `<i class="ph ${ext.iconValue} ${
        ext.color || "text-slate-900 dark:text-white"
      }"></i>`;
    }

    let badgeHTML = "";
    if (ext.featured) {
      badgeHTML += `<span class="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 uppercase">Featured</span>`;
    }
    if (ext.unsandboxed) {
      badgeHTML += `<span class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20 uppercase flex items-center gap-1"><i class="ph-bold ph-warning"></i> Unsandboxed</span>`;
    }
    els.modalBadges.innerHTML = badgeHTML;

    const newDownload = els.modalDownloadBtn.cloneNode(true);
    els.modalDownloadBtn.parentNode.replaceChild(
      newDownload,
      els.modalDownloadBtn
    );
    els.modalDownloadBtn = newDownload;

    els.modalDownloadBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const response = await fetch(ext.url);
        if (!response.ok) throw new Error("Download failed");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${ext.id}.js`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        showToast("Download started");
      } catch (err) {
        window.open(ext.url, "_blank");
        showToast("Opening file directly...", true);
      }
    });

    els.modalOpenBtn.href = `https://turbowarp.org/editor?extension=${encodeURIComponent(
      ext.url
    )}`;

    const newCopy = els.modalCopyBtn.cloneNode(true);
    els.modalCopyBtn.parentNode.replaceChild(newCopy, els.modalCopyBtn);
    els.modalCopyBtn = newCopy;
    els.modalCopyBtn.addEventListener("click", () =>
      copyToClipboard(ext.url, els.modalCopyBtn)
    );

    els.modal.classList.remove("hidden");
    setTimeout(() => {
      els.modal.classList.add("open");
      document.body.style.overflow = "hidden";
      els.modalCloseBtn.focus();
    }, 10);
  }

  function closeModal() {
    try {
      history.pushState(
        null,
        null,
        window.location.pathname + window.location.search
      );
    } catch (e) {
      // History API may not be available in some environments
    }
    els.modal.classList.remove("open");
    setTimeout(() => {
      els.modal.classList.add("hidden");
      document.body.style.overflow = "";
      if (lastFocusedElement) lastFocusedElement.focus();
    }, 300);
  }

  function checkHash() {
    const hash = window.location.hash.substring(1);
    if (hash) openModal(hash);
  }

  // --- UTILS ---
  function normalizeCategory(cat) {
    if (!cat) return "utilities";
    return cat.toLowerCase().replace(/\s+/g, "-").trim();
  }

  function restoreState() {
    const s = localStorage.getItem("tw_gallery_search");
    const c = localStorage.getItem("tw_gallery_category");
    if (s) els.searchInput.value = s;
    if (c) currentCategory = c;
  }

  function copyToClipboard(text, btn) {
    const original = btn.innerHTML;
    const setCopied = () => {
      btn.innerHTML = `<i class="ph-bold ph-check text-green-500 text-lg"></i> <span>Copied!</span>`;
      setTimeout(() => (btn.innerHTML = original), 2000);
    };
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("Copied!");
        setCopied();
      })
      .catch(() => {
        const t = document.createElement("textarea");
        t.value = text;
        document.body.appendChild(t);
        t.select();
        try {
          document.execCommand("copy");
          showToast("Copied!");
          setCopied();
        } catch (e) {
          showToast("Error copying", true);
        }
        document.body.removeChild(t);
      });
  }

  function showToast(msg, isErr = false) {
    const t = document.createElement("div");
    t.className = `toast px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium backdrop-blur-md ${
      isErr
        ? "bg-red-500/90 text-white"
        : "bg-slate-800/90 dark:bg-white/90 text-white dark:text-slate-900"
    }`;
    t.innerHTML = `<i class="ph ${
      isErr ? "ph-warning-circle" : "ph-check-circle"
    } text-lg"></i> ${msg}`;
    els.toastContainer.appendChild(t);
    setTimeout(() => {
      t.classList.add("hiding");
      t.addEventListener("animationend", () => t.remove());
    }, 3000);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
