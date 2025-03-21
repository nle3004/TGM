let map, marker;

// Replace these with your GitHub repository details
const GITHUB_REPO_OWNER = "nle3004";
const GITHUB_REPO_NAME = "TGM";
const GITHUB_PAT = "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"; // Generate this in GitHub Settings

document.addEventListener("DOMContentLoaded", () => {
  const reviewForm = document.getElementById("reviewForm");
  const reviewsList = document.getElementById("reviewsList");

  let reviews = [];

  // Initialize Leaflet Map
  function initMap() {
    map = L.map("map").setView([3.0738, 101.6059], 12); // Default to Petaling Jaya, Selangor, Malaysia

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
    }).addTo(map);

    geocoder.on("markgeocode", (event) => {
      const { center } = event.geocode;
      placeMarker(center);
    });

    map.on("click", (event) => {
      placeMarker(event.latlng);
    });
  }

  function placeMarker(location) {
    if (marker) {
      map.removeLayer(marker);
    }
    marker = L.marker(location).addTo(map);

    document.getElementById("latitude").value = location.lat;
    document.getElementById("longitude").value = location.lng;
  }

  // Fetch reviews from GitHub
  async function fetchReviews() {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/reviews.json`
      );
      const data = await response.json();
      const decodedContent = atob(data.content); // Decode Base64 content
      reviews = JSON.parse(decodedContent);
      displayReviews();
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  }

  // Save reviews to GitHub
  async function saveReviews() {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/reviews.json`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${GITHUB_PAT}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Update reviews",
            content: btoa(JSON.stringify(reviews)), // Encode to Base64
            sha: await getReviewsSHA(), // Get the current SHA of the file
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save reviews: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error saving reviews:", error);
    }
  }

  // Get the current SHA of the reviews.json file
  async function getReviewsSHA() {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/reviews.json`
    );
    const data = await response.json();
    return data.sha;
  }

  // Display reviews on page load
  function displayReviews() {
    reviewsList.innerHTML = "";
    reviews.forEach((review, index) => {
      const reviewDiv = document.createElement("div");
      reviewDiv.classList.add("review-item");
      reviewDiv.innerHTML = `
        <strong>${review.restaurantName}</strong><br>
        Recommended Food:<br>${review.recommendedFood.replace(/\n/g, "<br>")}<br>
        Rating: ${review.rating}/5<br>
        Price: ${"$".repeat(review.price)}<br>
        Ambience: ${"🌟".repeat(review.ambience)}<br>
        Last Visited: ${review.lastVisited}<br>
        Location: <a href="https://www.openstreetmap.org/?mlat=${review.latitude}&mlon=${review.longitude}#map=18/${review.latitude}/${review.longitude}" target="_blank">View on OpenStreetMap</a><br>
        <button onclick="deleteReview(${index})">Delete</button>
      `;
      reviewsList.appendChild(reviewDiv);
    });
  }

  // Handle form submission
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const restaurantName = document.getElementById("restaurantName").value;
    const recommendedFood = document.getElementById("recommendedFood").value
      .split("\n")
      .filter(item => item.trim() !== "")
      .map(item => `- ${item}`)
      .join("\n");

    const rating = parseInt(document.getElementById("rating").value);
    const price = parseInt(document.getElementById("price").value);
    const ambience = parseInt(document.getElementById("ambience").value);
    const lastVisited = document.getElementById("lastVisited").value;
    const latitude = parseFloat(document.getElementById("latitude").value);
    const longitude = parseFloat(document.getElementById("longitude").value);

    if (![rating, price, ambience].every(val => val >= 1 && val <= 5)) {
      alert("Please ensure Rating, Price, and Ambience are between 1 and 5.");
      return;
    }

    if (!latitude || !longitude) {
      alert("Please select a location on the map.");
      return;
    }

    const newReview = {
      restaurantName,
      recommendedFood,
      rating,
      price,
      ambience,
      lastVisited,
      latitude,
      longitude,
    };

    reviews.push(newReview);
    await saveReviews();
    displayReviews();

    reviewForm.reset();
    if (marker) map.removeLayer(marker);
  });

  window.deleteReview = async (index) => {
    reviews.splice(index, 1);
    await saveReviews();
    displayReviews();
  };

  // Initialize map and fetch reviews
  initMap();
  fetchReviews();
});
