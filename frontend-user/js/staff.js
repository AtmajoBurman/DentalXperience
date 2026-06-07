// staff.js

// Using fetchData and getDriveThumbnail from main.js

function createStaffCard(staff) {
    const card = document.createElement('div');
    card.classList.add('glass-card', 'staff-card');
    
    // Avatar
    const avatarContainer = document.createElement('div');
    avatarContainer.classList.add('staff-avatar');
    const img = document.createElement('img');
    if (staff.profile_picture) {
        img.src = getDriveThumbnail(staff.profile_picture);
        img.setAttribute('referrerpolicy', 'no-referrer');
    } else {
        img.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(staff.name) + '&background=d4af37&color=fff';
    }
    img.alt = staff.name;
    avatarContainer.appendChild(img);

    // Body
    const body = document.createElement('div');
    body.classList.add('staff-body');

    const name = document.createElement('h3');
    name.classList.add('staff-name');
    name.textContent = staff.name;

    const tenure = document.createElement('div');
    tenure.classList.add('staff-tenure');
    const startYear = new Date(staff.from_date).getFullYear();
    if (staff.till_date) {
        const endYear = new Date(staff.till_date).getFullYear();
        tenure.innerHTML = `<span class="badge badge-alumni">Alumni (${startYear} - ${endYear})</span>`;
    } else {
        tenure.innerHTML = `<span class="badge badge-current">Since ${startYear}</span>`;
    }

    const desc = document.createElement('p');
    desc.classList.add('staff-desc');
    desc.textContent = staff.description;

    body.appendChild(name);
    body.appendChild(tenure);
    body.appendChild(desc);

    // Footer (Contact)
    const footer = document.createElement('div');
    footer.classList.add('staff-footer');
    
    if (staff.phone_number) {
        const phone = document.createElement('a');
        phone.href = `tel:${staff.phone_number}`;
        phone.classList.add('staff-contact-btn');
        phone.innerHTML = `<ion-icon name="call-outline"></ion-icon> ${staff.phone_number}`;
        footer.appendChild(phone);
    }

    card.appendChild(avatarContainer);
    card.appendChild(body);
    card.appendChild(footer);

    return card;
}

async function loadStaff() {
    const staffArray = await fetchData('/staff/');
    if (!staffArray || staffArray.length === 0) return;

    const currentSection = document.getElementById('current-staff-section');
    const currentGrid = document.getElementById('current-staff-grid');
    
    const alumniSection = document.getElementById('alumni-staff-section');
    const alumniGrid = document.getElementById('alumni-staff-grid');

    let hasCurrent = false;
    let hasAlumni = false;

    staffArray.forEach(staff => {
        const card = createStaffCard(staff);
        if (staff.till_date) {
            alumniGrid.appendChild(card);
            hasAlumni = true;
        } else {
            currentGrid.appendChild(card);
            hasCurrent = true;
        }
    });

    if (hasCurrent) {
        currentSection.style.display = 'block';
    }
    if (hasAlumni) {
        alumniSection.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadStaff();
});
