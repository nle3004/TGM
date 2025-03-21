let map, marker;

document.addEventListener("DOMContentLoaded", () => {
  const reviewForm = document.getElementById("reviewForm");
  const reviewsList = document.getElementById("reviewsList");

  // Load existing reviews from localStorage
  let reviews = JSON.parse(localStorage.getItem("reviews")) || [];

  // Initialize Leaflet Map
  function initMap() {
    map = L.map("map").setView([3.0738, 101.6059], 12); // Default to Petaling Jaya, Selangor, Malaysia

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add Geocoder (search bar)
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false,
    }).addTo(map);

    geocoder.on("markgeocode", (event) => {
      const { center } = event.geocode;
      placeMarker(center);
    });

    // Add a click event listener to the map
    map.on("click", (event) => {
      placeMarker(event.latlng);
    });
  }

  // Place a marker on the map and update hidden fields
  function placeMarker(location) {
    if (marker) {
      map.removeLayer(marker); // Remove existing marker
    }
    marker = L.marker(location).addTo(map);

    // Update hidden fields with latitude and longitude
    document.getElementById("latitude").value = location.lat;
    document.getElementById("longitude").value = location.lng;
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

  // Save reviews to localStorage
  function saveReviews() {
    localStorage.setItem("reviews", JSON.stringify(reviews));
  }

  // Handle form submission
  reviewForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const restaurantName = document.getElementById("restaurantName").value;
    const recommendedFood = document.getElementById("recommendedFood").value
      .split("\n") // Split by newline
      .filter(item => item.trim() !== "") // Remove empty lines
      .map(item => `- ${item}`) // Add bullet points
      .join("\n"); // Join back into a single string

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
    saveReviews();
    displayReviews();

    // Clear form fields
    reviewForm.reset();
    if (marker) map.removeLayer(marker); // Clear the marker
  });

  // Delete a review
  window.deleteReview = (index) => {
    reviews.splice(index, 1);
    saveReviews();
    displayReviews();
  };

  // Initialize map and display reviews
  initMap();
  displayReviews();
});