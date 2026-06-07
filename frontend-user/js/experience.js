// experience.js

// Using fetchData and getDriveThumbnail from main.js

function createExperienceCard(exp) {
    const card = document.createElement('div');
    card.classList.add('exp-card');
    
    // Image Section
    const imgContainer = document.createElement('div');
    imgContainer.classList.add('exp-image-container');
    const img = document.createElement('img');
    if (exp.picture_link) {
        img.src = getDriveThumbnail(exp.picture_link);
        img.setAttribute('referrerpolicy', 'no-referrer');
    } else {
        // Fallback abstract pattern
        img.src = 'https://picsum.photos/seed/' + exp.id + '/600/400';
    }
    img.alt = exp.heading;
    imgContainer.appendChild(img);

    // Content Section
    const content = document.createElement('div');
    content.classList.add('exp-content');

    // Header (Title and Badge)
    const header = document.createElement('div');
    header.classList.add('exp-header');
    
    const badge = document.createElement('span');
    badge.classList.add('exp-category-badge');
    badge.textContent = exp.experience_category;
    
    const heading = document.createElement('h3');
    heading.classList.add('exp-heading');
    heading.textContent = exp.heading;

    header.appendChild(badge);
    header.appendChild(heading);

    // Body (Description)
    const desc = document.createElement('div');
    desc.classList.add('exp-description');
    desc.textContent = exp.description;

    // Footer (Dates)
    const footer = document.createElement('div');
    footer.classList.add('exp-footer');
    
    const startYear = new Date(exp.exp_start).getFullYear();
    const endYear = exp.exp_end ? new Date(exp.exp_end).getFullYear() : 'Present';
    
    footer.innerHTML = `<ion-icon name="calendar-outline"></ion-icon> ${startYear} - ${endYear}`;

    // Assemble Card
    content.appendChild(header);
    content.appendChild(desc);
    content.appendChild(footer);

    card.appendChild(imgContainer);
    card.appendChild(content);

    return card;
}

async function loadExperience() {
    const expArray = await fetchData('/experience/');
    if (!expArray || expArray.length === 0) return;

    const expGrid = document.getElementById('experience-grid');

    // The user explicitly asked NOT to sort them chronologically, 
    // so we will just iterate in the order they come from the backend.
    expArray.forEach(exp => {
        const card = createExperienceCard(exp);
        expGrid.appendChild(card);
    });
}

async function loadDoctorProfile() {
    const profile = await fetchData('/profile/');
    if (profile) {
        document.getElementById('doctorNameSpan').textContent = profile.name_of_doctor || 'Doctor';
        if (profile.doctor_profile_picture) {
            const img = document.getElementById('doctorProfileImg');
            img.src = getDriveThumbnail(profile.doctor_profile_picture);
            img.setAttribute('referrerpolicy', 'no-referrer');
            img.style.display = 'block';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadDoctorProfile();
    loadExperience();
});
