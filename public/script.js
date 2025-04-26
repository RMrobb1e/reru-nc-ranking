let debounceTimer; // Declare a variable to hold the debounce timer

document.addEventListener("DOMContentLoaded", () => {
  // Ensure the DOM is fully loaded before accessing elements
  const ignInput = document.getElementById("ignInput");

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

async function searchIGN() {
  const ign = document.getElementById("ignInput").value.trim();
  const resultArea = document.getElementById("resultArea");
  resultArea.innerHTML = "";

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

  const url = `/api/growth?ign=${encodeURIComponent(ign)}`;

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

    resultArea.innerHTML = `
      <div class="border rounded-lg p-4 bg-gray-50">
        <h2 class="text-xl font-semibold mb-2">Character: ${
          item.CharacterName
        }</h2>
        <table class="w-full text-sm text-left">
          <tbody>
            <tr><td class="font-semibold">Rank</td><td>${item.rank}</td></tr>
            <tr><td class="font-semibold">Growth Rate</td><td>${
              item.score
            }</td></tr>
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
      </div>
    `;
  } catch (err) {
    resultArea.innerHTML = `<p class='text-red-500'>Failed to fetch data. Try again later.</p>`;
    console.error(err);
  }
}
