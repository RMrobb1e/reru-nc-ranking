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
});

async function fetchGiphyMeme() {
  try {
    const keyResponse = await fetch("/api/giphy-key");
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
    const response = await fetch("/api/metadata");
    const data = await response.json();

    return data;
  } catch (err) {
    console.error("Error fetching metadata:", err);
    return { success: false, error: err };
  }
}

async function searchIGN() {
  const ign = document.getElementById("ignInput").value.trim();
  const resultArea = document.getElementById("resultArea");
  resultArea.innerHTML = "";
  const regionCode = document.getElementById("regionSelect").value; // Get selected region

  if (!ign) {
    resultArea.innerHTML = "<p class='text-red-500'>Please enter an IGN.</p>";
    return;
  }

  // Show loading spinner
  resultArea.innerHTML = `
    <div class="flex justify-center items-center">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  `;

  const url = `/api/growth?ign=${encodeURIComponent(
    ign,
  )}&regionCode=${regionCode}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const items = data.pageProps.rankingListData.items;

    if (!items || items.length === 0) {
      resultArea.innerHTML =
        "<p class='text-gray-500'>No data found for that IGN.</p>";
      return;
    }

    const item = items[0];
    const giphyUrl = await fetchGiphyMeme();

    resultArea.innerHTML = `
      <div class="border rounded-lg p-4 bg-gray-50">
        <h2 class="text-xl font-semibold mb-2">Character: ${
          item.CharacterName
        }</h2>
        <table class="w-full text-sm text-left">
          <tbody>
            <tr><td class="font-semibold">Rank</td><td>${item.rank}</td></tr>
            <tr><td class="font-semibold">Growth Rate</td><td>${item.score.toLocaleString()}</td></tr>
            <tr><td class="font-semibold">Realm</td><td>${
              item.RealmName
            }</td></tr>
            <tr><td class="font-semibold">Region</td><td>${
              item.RegionName
            }</td></tr>
            <tr><td class="font-semibold">Guild</td><td>${
              item.GuildName || "-"
            }</td></tr>
            <tr><td class="font-semibold">Guild Union</td><td>${
              item.GuildUnionName || "-"
            }</td></tr>
            <tr><td class="font-semibold">Max Rank Date</td><td>${new Date(
              item.MaxRankDate,
            ).toLocaleString()}</td></tr>
          </tbody>
        </table>
         ${
           giphyUrl
             ? `<div class="mt-4">
                <img src="${giphyUrl}" alt="Random Meme" class="rounded-lg shadow-md h-[200px] w-auto mx-auto" />
              </div>`
             : ""
         }
      </div>
    `;
  } catch (err) {
    resultArea.innerHTML = `<p class='text-red-500'>Failed to fetch data. Try again later.</p>`;
    console.error(err);
  }
}
