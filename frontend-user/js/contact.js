// contact.js

// Using fetchData and getDriveThumbnail from main.js

function createContactCard(contact) {
    const card = document.createElement('div');
    card.classList.add('glass-card', 'contact-card');
    
    // Image Section
    const imgContainer = document.createElement('div');
    imgContainer.classList.add('contact-image-container');
    const img = document.createElement('img');
    if (contact.profile_picture) {
        img.src = getDriveThumbnail(contact.profile_picture);
        img.setAttribute('referrerpolicy', 'no-referrer');
    } else {
        // Fallback abstract pattern
        img.src = 'https://picsum.photos/seed/' + contact.id + '/400/400';
    }
    img.alt = contact.name;
    imgContainer.appendChild(img);

    // Content Section
    const content = document.createElement('div');
    content.classList.add('contact-content');

    const heading = document.createElement('h3');
    heading.classList.add('contact-heading');
    heading.textContent = contact.name;

    const phoneLink = document.createElement('a');
    phoneLink.classList.add('contact-number');
    phoneLink.href = `tel:${contact.contact_number}`;
    phoneLink.innerHTML = `<ion-icon name="call-outline"></ion-icon> ${contact.contact_number}`;

    content.appendChild(heading);
    content.appendChild(phoneLink);

    // Assemble Card
    card.appendChild(imgContainer);
    card.appendChild(content);

    return card;
}

async function loadContacts() {
    const arr = await fetchData('/contacts/');
    if (!arr || arr.length === 0) {
        document.getElementById('contacts-container').innerHTML = '<p style="text-align:center;">No contacts found.</p>';
        return;
    }

    const container = document.getElementById('contacts-container');

    arr.forEach(contact => {
        const card = createContactCard(contact);
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadContacts();
});
