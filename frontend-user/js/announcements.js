// announcements.js

// Using fetchData from main.js

function createAnnouncementCard(announcement) {
    const card = document.createElement('div');
    card.classList.add('glass-card', 'announcement-card');
    
    // Left side: Date badge
    const dateContainer = document.createElement('div');
    dateContainer.classList.add('ann-date-container');
    
    const eventDate = new Date(announcement.date_and_time);
    const month = eventDate.toLocaleString('default', { month: 'short' });
    const day = eventDate.getDate();
    const year = eventDate.getFullYear();
    
    dateContainer.innerHTML = `
        <span class="ann-month">${month}</span>
        <span class="ann-day">${day}</span>
        <span class="ann-year">${year}</span>
    `;

    // Right side: Content
    const content = document.createElement('div');
    content.classList.add('ann-content');

    const header = document.createElement('div');
    header.classList.add('ann-header');
    
    const heading = document.createElement('h3');
    heading.classList.add('ann-heading');
    heading.textContent = announcement.heading;

    header.appendChild(heading);

    const desc = document.createElement('p');
    desc.classList.add('ann-description');
    desc.textContent = announcement.description;

    content.appendChild(header);
    content.appendChild(desc);

    card.appendChild(dateContainer);
    card.appendChild(content);

    return card;
}

async function loadAnnouncements() {
    const arr = await fetchData('/announcements/');
    if (!arr || arr.length === 0) {
        document.getElementById('announcements-container').innerHTML = '<p style="text-align:center;">No announcements at this time.</p>';
        return;
    }

    const container = document.getElementById('announcements-container');

    // Sort by date_and_time descending (newest first)
    arr.sort((a, b) => new Date(b.date_and_time) - new Date(a.date_and_time));

    arr.forEach(ann => {
        const card = createAnnouncementCard(ann);
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadAnnouncements();
});
