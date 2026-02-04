document.addEventListener('DOMContentLoaded', () => {
    initMap();
});

async function initMap() {
    // Initialize map centered at a default location (e.g., London or a global view)
    const map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Fetch reports to show on the map
    // For demo purposes, we'll add some mock data if no real reports have coordinates
    // In a real app, you'd fetch reports that have Lat/Lng
    try {
        const response = await fetch(`${API_BASE_URL}/admin/reports`); // Assumes public view or dummy data
        let reports = [];
        if (response.ok) {
            reports = await response.json();
        }

        // Add some "Impact Highlights" (Successful Rescues)
        const highlights = [
            { pos: [13.0827, 80.2707], title: "Rescue in Chennai", desc: "A lost child returned home safely." },
            { pos: [19.0760, 72.8777], title: "Mumbai Outreach", desc: "Medical aid provided to three elderly individuals." },
            { pos: [28.6139, 77.2090], title: "Delhi Care", desc: "Immediate shelter provided to a vulnerable group." },
            { pos: [40.7128, -74.0060], title: "New York Chapter", desc: "Supporting local foster care systems." },
            { pos: [51.5074, -0.1278], title: "London Initiative", desc: "Bridging the gap for street children." }
        ];

        highlights.forEach(h => {
            const marker = L.marker(h.pos).addTo(map);
            marker.bindPopup(`<b>${h.title}</b><br>${h.desc}`);
        });

        // Add real reports if they have lat/lng (mocking some based on reports fetched)
        reports.forEach((report, index) => {
            if (index < 5) { // Just show first few for demo
                // Randomish locations around India for demo
                const lat = 15 + Math.random() * 10;
                const lng = 75 + Math.random() * 10;

                const circle = L.circle([lat, lng], {
                    color: report.status === 'resolved' ? 'green' : 'blue',
                    fillColor: report.status === 'resolved' ? '#00ff00' : '#0000ff',
                    fillOpacity: 0.5,
                    radius: 50000
                }).addTo(map);

                circle.bindPopup(`<b>Report ID: ${report.id}</b><br>Status: ${report.status}<br>${report.description.substring(0, 50)}...`);
            }
        });

    } catch (error) {
        console.error('Error loading map data:', error);
    }
}
