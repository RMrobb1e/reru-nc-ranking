const API_BASE = (() => {
  const hostname = window.location.hostname;
  switch (hostname) {
    case "localhost":
      return "http://localhost:3000";
    case "reru-nc-ranking.onrender.com":
      return "https://reru-nc-ranking.onrender.com";
    default:
      return "https://nc-ranking-backend.robbie-ad5.workers.dev";
  }
})(); // <- replace with your Cloudflare Worker URL

let debounceTimer; // Declare a variable to hold the debounce timer

document.addEventListener("DOMContentLoaded", async () => {
  // Ensure the DOM is fully loaded before accessing elements
  const ignInput = document.getElementById("ignInput");
  const regionSelect = document.getElementById("regionSelect");

  if (regionSelect) {
    const { regions } = await fetchMetadata();

    regions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region.code;
      option.textContent = region.name;

      if (region.code === 2020) {
        option.selected = true;
      }

      regionSelect.appendChild(option);
    });
  }

  if (ignInput) {
    ignInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        clearTimeout(debounceTimer); // Clear any existing timer
        debounceTimer = setTimeout(() => {
          searchIGN(); // Call the search function after the debounce delay
        }, 300); // Set a 300ms debounce delay
      }
    });
  }

  loadBookmarks();
  // UI elements
  const top1000Section = document.getElementById("top100Section");
  const searchSection = document.getElementById("searchSection");
  const showSearchBtn = document.getElementById("showSearchBtn");
  const showTop1000Btn = document.getElementById("showTop100Btn");
  const top1000TableArea = document.getElementById("top100TableArea");

  // Loader element for top 1000
  let top1000Loader = document.getElementById("top1000Loader");
  if (!top1000Loader) {
    top1000Loader = document.createElement("div");
    top1000Loader.id = "top1000Loader";
    top1000Loader.innerHTML = `<div class="flex justify-center items-center py-8"><div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div></div>`;
    top1000Loader.style.display = "none";
    top1000Section.insertBefore(top1000Loader, top1000Section.children[1]);
  }

  // Add region, guild, and union filter for top 1000
  let top1000RegionSelect = document.getElementById("top100RegionSelect");
  if (!top1000RegionSelect) {
    top1000RegionSelect = document.createElement("select");
    top1000RegionSelect.id = "top100RegionSelect";
    top1000RegionSelect.className = "p-2 border rounded-lg mb-2 mr-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100";
    top1000Section.insertBefore(
      top1000RegionSelect,
      top1000Section.children[2],
    );
  }

  // Add guild and union filter inputs
  let guildFilterInput = document.getElementById("guildFilterInput");
  if (!guildFilterInput) {
    guildFilterInput = document.createElement("input");
    guildFilterInput.id = "guildFilterInput";
    guildFilterInput.type = "text";
    guildFilterInput.placeholder = "Filter by Guild";
    guildFilterInput.className = "p-2 border rounded-lg mb-2 mr-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:caret-blue-400";
    top1000Section.insertBefore(guildFilterInput, top1000Section.children[3]);
  }
  let unionFilterInput = document.getElementById("unionFilterInput");
  if (!unionFilterInput) {
    unionFilterInput = document.createElement("input");
    unionFilterInput.id = "unionFilterInput";
    unionFilterInput.type = "text";
    unionFilterInput.placeholder = "Filter by Union";
    unionFilterInput.className = "p-2 border rounded-lg mb-2 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:caret-blue-400";
    top1000Section.insertBefore(unionFilterInput, top1000Section.children[4]);
  }

  // Populate top 1000 region select
  const { regions: allRegions } = await fetchMetadata();
  top1000RegionSelect.innerHTML = "";
  allRegions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region.code;
    option.textContent = region.name;
    if (region.code === 2020) option.selected = true;
    top1000RegionSelect.appendChild(option);
  });

  top1000RegionSelect.addEventListener("change", () => {
    renderTop1000();
  });
  guildFilterInput.addEventListener("input", () => {
    window.__top1000CurrentPage = 1;
    renderTop1000();
  });
  unionFilterInput.addEventListener("input", () => {
    window.__top1000CurrentPage = 1;
    renderTop1000();
  });
  guildFilterInput.addEventListener("input", () => {
    window.__top1000CurrentPage = 1;
    renderTop100();
  });
  unionFilterInput.addEventListener("input", () => {
    window.__top1000CurrentPage = 1;
    renderTop100();
  });

  // Show search UI
  if (showSearchBtn) {
    showSearchBtn.addEventListener("click", () => {
      top1000Section.style.display = "none";
      searchSection.style.display = "block";
    });
  }
  // Show top 1000 UI
  if (showTop1000Btn) {
    showTop1000Btn.addEventListener("click", () => {
      searchSection.style.display = "none";
      top1000Section.style.display = "block";
      renderTop1000();
    });
  }

  // --- Prefill filters from URL query params on load ---
  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name) || '';
  }
  function setQueryParam(name, value) {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(name, value);
    } else {
      url.searchParams.delete(name);
    }
    window.history.replaceState({}, '', url);
  }

  // Prefill filter inputs from URL
  guildFilterInput.value = getQueryParam('guild') || '';
  unionFilterInput.value = getQueryParam('union') || '';

  // Update URL when filters change
  guildFilterInput.addEventListener('input', () => {
    setQueryParam('guild', guildFilterInput.value.trim());
    window.__top1000CurrentPage = 1;
    renderTop1000();
  });
  unionFilterInput.addEventListener('input', () => {
    setQueryParam('union', unionFilterInput.value.trim());
    window.__top1000CurrentPage = 1;
    renderTop1000();
  });

  // Fetch and render top 1000 on load
  async function renderTop1000() {
    top1000TableArea.innerHTML = "";
    top1000Loader.style.display = "";
    try {
      const regionCode =
        document.getElementById("top100RegionSelect")?.value || 2020;
      const pageSize = 100;
      let currentPage = window.__top1000CurrentPage || 1;
      let items = window.__top1000Cache && window.__top1000Cache[regionCode];

      // If not cached and first page, fetch all 1000
      if (!items && currentPage === 1) {
        let url = `${API_BASE}/api/growth-top-1000?regionCode=${regionCode}`;
        if (window.location.hostname === "localhost") {
          url = `http://localhost:8787/api/growth-top-1000?regionCode=${regionCode}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        items = data?.items;
        if (!window.__top1000Cache) window.__top1000Cache = {};
        window.__top1000Cache[regionCode] = items;
      }

      // If not cached and not first page, fetch only the page
      if (!items) {
        let url = `${API_BASE}/api/growth-page?regionCode=${regionCode}&page=${currentPage}`;
        if (window.location.hostname === "localhost") {
          url = `http://localhost:8787/api/growth-page?regionCode=${regionCode}&page=${currentPage}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        items = data?.items;
      }

      if (!Array.isArray(items) || items.length === 0) {
        top1000Loader.style.display = "none";
        top1000TableArea.innerHTML =
          '<div class="text-gray-500 py-8 text-center">No data found.</div>';
        return;
      }

      // Pagination logic
      const totalPages = 10; // 1000 / 100
      if (currentPage > totalPages) currentPage = 1;
      window.__top1000CurrentPage = currentPage;

      function renderPagination() {
        let html = '<div class="flex justify-center my-4 gap-2">';
        for (let i = 1; i <= totalPages; i++) {
          html += `<button class="px-3 py-1 rounded ${
            i === currentPage
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }" data-page="${i}">${i}</button>`;
        }
        html += "</div>";
        return html;
      }

      // Filter by guild/union if set
      const guildFilter =
        document
          .getElementById("guildFilterInput")
          ?.value.trim()
          .toLowerCase() || "";
      const unionFilter =
        document
          .getElementById("unionFilterInput")
          ?.value.trim()
          .toLowerCase() || "";
      let filteredItems = items;
      if (guildFilter) {
        filteredItems = filteredItems.filter((p) =>
          (p.GuildName || "").toLowerCase().includes(guildFilter),
        );
      }
      if (unionFilter) {
        filteredItems = filteredItems.filter((p) =>
          (p.GuildUnionName || "").toLowerCase().includes(unionFilter),
        );
      }

      // Slice items for current page if we have all 1000, else just use items
      let pagedItems = filteredItems;
      if (window.__top1000Cache && window.__top1000Cache[regionCode]) {
        pagedItems = filteredItems.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize,
        );
      }
      top1000Loader.style.display = "none";
      top1000TableArea.innerHTML =
        renderTop1000Table(pagedItems) + renderPagination();

      // Add event listeners for pagination buttons
      top1000TableArea.querySelectorAll("button[data-page]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          window.__top1000CurrentPage = Number(btn.getAttribute("data-page"));
          renderTop1000();
        });
      });
    } catch (err) {
      top1000Loader.style.display = "none";
      top1000TableArea.innerHTML =
        '<div class="text-red-500 py-8 text-center">Failed to load top 1000 players.</div>';
    }
  }

  // Table rendering helper
  function renderTop1000Table(players) {
    return `<table class="min-w-full text-sm text-left border">
      <thead class="bg-gray-100 dark:bg-gray-700">
        <tr>
          <th class="px-3 py-2 border text-gray-700 dark:text-gray-100">Rank</th>
          <th class="px-3 py-2 border text-gray-700 dark:text-gray-100">IGN</th>
          <th class="px-3 py-2 border text-gray-700 dark:text-gray-100">Growth Rate</th>
          <th class="px-3 py-2 border text-gray-700 dark:text-gray-100">Realm</th>
          <th class="px-3 py-2 border text-gray-700 dark:text-gray-100">Region</th>
          <th class="px-3 py-2 border text-gray-700 dark:text-gray-100">Guild</th>
          <th class="px-3 py-2 border text-gray-700 dark:text-gray-100">Union</th>
        </tr>
      </thead>
      <tbody>
        ${players
          .map(
            (p) => `
          <tr>
            <td class="px-3 py-2 border">${p.rank}</td>
            <td class="px-3 py-2 border">${p.CharacterName}</td>
            <td class="px-3 py-2 border">${Number(
              p.score,
            ).toLocaleString()}</td>
            <td class="px-3 py-2 border">${p.RealmName}</td>
            <td class="px-3 py-2 border">${p.RegionName}</td>
            <td class="px-3 py-2 border">${p.GuildName || ""}</td>
            <td class="px-3 py-2 border">${p.GuildUnionName || ""}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>`;
  }

  // Populate region select
  if (regionSelect) {
    const { regions } = await fetchMetadata();
    regions.forEach((region) => {
      const option = document.createElement("option");
      option.value = region.code;
      option.textContent = region.name;
      if (region.code === 2020) {
        option.selected = true;
      }
      regionSelect.appendChild(option);
    });
  }

  // Enter key triggers search
  if (ignInput) {
    ignInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        clearTimeout(debounceTimer);
        searchIGN();
      }
    });
  }

  loadBookmarks();
  renderTop1000();
});

// Bookmark management functions
function loadBookmarks() {
  const bookmarks = JSON.parse(localStorage.getItem("ignBookmarks") || "[]");
  const bookmarksContainer = document.getElementById("bookmarks");

  bookmarksContainer.innerHTML = bookmarks
    .map(
      (bookmark) => `
    <button 
      onclick="selectBookmark('${bookmark.ign}', '${bookmark.region}')"
      class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm flex items-center gap-2"
    >
      ${bookmark.ign}
      <span onclick="event.stopPropagation(); removeBookmark('${bookmark.ign}')" class="text-gray-400 hover:text-red-500">×</span>
    </button>
  `,
    )
    .join("");
}

function toggleBookmark() {
  const ign = document.getElementById("ignInput").value.trim();
  const region = document.getElementById("regionSelect").value;

  if (!ign) return;

  const bookmarks = JSON.parse(localStorage.getItem("ignBookmarks") || "[]");
  const exists = bookmarks.some((b) => b.ign === ign);

  if (exists) {
    removeBookmark(ign);
  } else {
    bookmarks.push({ ign, region });
    localStorage.setItem("ignBookmarks", JSON.stringify(bookmarks));
    loadBookmarks();
  }
}

function removeBookmark(ign) {
  const bookmarks = JSON.parse(localStorage.getItem("ignBookmarks") || "[]");
  const filtered = bookmarks.filter((b) => b.ign !== ign);
  localStorage.setItem("ignBookmarks", JSON.stringify(filtered));
  loadBookmarks();
}

function selectBookmark(ign, region) {
  document.getElementById("ignInput").value = ign;
  document.getElementById("regionSelect").value = region;
  searchIGN();
}

async function fetchGiphyMeme() {
  try {
    const keyResponse = await fetch(`${API_BASE}/api/giphy-key`);
    const { apiKey } = await keyResponse.json();

    if (!apiKey) {
      console.error("Giphy API key not found.");
      return null;
    }

    const giphyResponse = await fetch(
      `https://api.giphy.com/v1/gifs/random?api_key=${apiKey}&tag=meme`,
    );
    const giphyData = await giphyResponse.json();
    return giphyData.data.images.original.url;
  } catch (err) {
    console.error("Failed to fetch Giphy meme:", err);
    return null;
  }
}

async function fetchMetadata() {
  try {
    const response = await fetch(`${API_BASE}/api/metadata`);
    const data = await response.json();

    return data;
  } catch (err) {
    console.error("Error fetching metadata:", err);
    return { success: false, error: err };
  }
}

async function searchIGN() {
  const ign = document.getElementById("ignInput").value.trim();
  const searchButton = document.querySelector("button[onclick='searchIGN()']");
  const resultArea = document.getElementById("resultArea");
  resultArea.innerHTML = "";
  const regionCode = document.getElementById("regionSelect").value; // Get selected region

  // Update bookmark button appearance
  const bookmarks = JSON.parse(localStorage.getItem("ignBookmarks") || "[]");
  const isBookmarked = bookmarks.some((b) => b.ign === ign);
  bookmarkButton.querySelector("svg").style.fill = isBookmarked
    ? "currentColor"
    : "none";

  if (!ign) {
    resultArea.innerHTML =
      "<p class='text-red-500 dark:text-red-400 text-center font-medium mt-4'>Please enter an IGN.</p>";
    return;
  }

  searchButton.disabled = true;
  searchButton.classList.add("opacity-50", "cursor-not-allowed");

  // Show loading spinner
  resultArea.innerHTML = `
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
    </div>
  `;

  const url = `${API_BASE}/api/growth?ign=${encodeURIComponent(
    ign,
  )}&regionCode=${regionCode}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const items = data.pageProps.rankingListData.items;

    if (!items || items.length === 0) {
      resultArea.innerHTML =
        "<p class='text-gray-500 dark:text-gray-400 text-center font-medium mt-4'>No data found for that IGN.</p>";
      return;
    }

    const item = items[0];
    const giphyUrl = await fetchGiphyMeme();

    resultArea.innerHTML = `
      <div class="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 shadow-lg transition-colors duration-300">
        <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Character: ${
          item.CharacterName
        }</h2>
        <table class="w-full text-sm text-left">
          <tbody>
            <tr><td class="font-semibold text-gray-700 dark:text-gray-300">Rank</td><td class="text-gray-900 dark:text-gray-100">${
              item.rank
            }</td></tr>
            <tr><td class="font-semibold text-gray-700 dark:text-gray-300">Growth Rate</td><td class="text-blue-700 dark:text-blue-400">${item.score.toLocaleString()}</td></tr>
            <tr><td class="font-semibold text-gray-700 dark:text-gray-300">Realm</td><td class="text-gray-900 dark:text-gray-100">${
              item.RealmName
            }</td></tr>
            <tr><td class="font-semibold text-gray-700 dark:text-gray-300">Region</td><td class="text-gray-900 dark:text-gray-100">${
              item.RegionName
            }</td></tr>
            <tr><td class="font-semibold text-gray-700 dark:text-gray-300">Guild</td><td class="text-gray-900 dark:text-gray-100">${
              item.GuildName || "-"
            }</td></tr>
            <tr><td class="font-semibold text-gray-700 dark:text-gray-300">Guild Union</td><td class="text-gray-900 dark:text-gray-100">${
              item.GuildUnionName || "-"
            }</td></tr>
            <tr><td class="font-semibold text-gray-700 dark:text-gray-300">Max Rank Date</td><td class="text-gray-900 dark:text-gray-100">${new Date(
              item.MaxRankDate,
            ).toLocaleString()}</td></tr>
          </tbody>
        </table>
         ${
           giphyUrl
             ? `<div class="mt-4">
                <img src="${giphyUrl}" alt="Random Meme" class="rounded-lg shadow-md h-[200px] w-auto mx-auto border dark:border-gray-700" />
              </div>`
             : ""
         }
      </div>
    `;
  } catch (err) {
    resultArea.innerHTML = `<p class='text-red-500 dark:text-red-400 text-center font-medium mt-4'>Failed to fetch data. Try again later.</p>`;
    console.error(err);
  } finally {
    // Re-enable the search button
    searchButton.disabled = false;
    searchButton.classList.remove("opacity-50", "cursor-not-allowed");
  }
}
