document.addEventListener('DOMContentLoaded', function () {
    loadWebinars();
});

async function loadWebinars() {
    const upcomingGrid = document.querySelector('.webinar-list .webinar-grid');
    const pastGrid = document.querySelector('.past-webinars .webinar-grid');

    if (!upcomingGrid || !pastGrid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/webinars/`);
        if (!response.ok) {
            upcomingGrid.innerHTML = '<p>Error loading webinars.</p>';
            return;
        }

        const webinars = await response.json();
        renderWebinars(webinars, upcomingGrid, pastGrid);

    } catch (error) {
        console.error('Webinar error:', error);
        upcomingGrid.innerHTML = '<p>Error connecting to server.</p>';
    }
}

function renderWebinars(webinars, upcomingGrid, pastGrid) {
    upcomingGrid.innerHTML = '';
    pastGrid.innerHTML = '';

    const now = new Date();

    webinars.forEach(webinar => {
        const webinarDate = new Date(webinar.date_time);
        const isPast = webinarDate < now;

        const card = createWebinarCard(webinar, isPast);

        if (isPast) {
            pastGrid.appendChild(card);
        } else {
            upcomingGrid.appendChild(card);
        }
    });

    if (upcomingGrid.children.length === 0) {
        upcomingGrid.innerHTML = '<p>No upcoming webinars scheduled.</p>';
    }
    if (pastGrid.children.length === 0) {
        pastGrid.innerHTML = '<p>No past webinars recorded.</p>';
    }
}

function createWebinarCard(webinar, isPast) {
    const card = document.createElement('div');
    card.className = `webinar-card ${isPast ? 'past' : ''}`;

    const date = new Date(webinar.date_time);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    card.innerHTML = `
        ${!isPast ? `<div class="card-badge">${webinar.is_live ? 'LIVE' : ''} ${dateStr}</div>` : ''}
        <div class="card-content">
            <h3>${webinar.title}</h3>
            <p>${webinar.description}</p>
            <div class="card-meta">
                <span>🕒 ${timeStr}</span>
                <span>👤 Expert: ${webinar.expert_name}</span>
            </div>
            ${isPast
            ? (webinar.recording_url ? `<button class="watch-btn" onclick="window.open('${webinar.recording_url}', '_blank')">Watch Recording</button>` : '<button class="watch-btn" disabled>Recording Unavailable</button>')
            : `<button class="join-btn">${webinar.is_live ? 'Register Now' : 'Set Reminder'}</button>`
        }
        </div>
    `;

    return card;
}
