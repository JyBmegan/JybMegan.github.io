    <!-- Leaflet map JS -->
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>

    <!-- Initialize the map -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // 1. Create the map in the #map-container div, center & zoom
        const map = L.map('map-container').setView([1.29027, 103.851959], 2);

        // 2. Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // 3. Example marker (replace coords & popup text as you like)
        L.marker([1.29027, 103.851959])
         .addTo(map)
         .bindPopup('Singapore — where it all began!')
         .openPopup();
      });
    </script>

