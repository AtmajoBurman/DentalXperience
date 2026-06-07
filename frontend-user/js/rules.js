// rules.js

// Using fetchData from main.js

function createAccordionItem(category) {
    const item = document.createElement('div');
    item.classList.add('accordion-item');

    // Header (Button)
    const header = document.createElement('button');
    header.classList.add('accordion-header');
    
    const title = document.createElement('span');
    title.textContent = category.name;
    
    const icon = document.createElement('ion-icon');
    icon.name = 'chevron-down-outline';
    icon.classList.add('accordion-icon');

    header.appendChild(title);
    header.appendChild(icon);

    // Content area
    const content = document.createElement('div');
    content.classList.add('accordion-content');

    const ul = document.createElement('ul');
    ul.classList.add('rules-list');

    if (category.rules && category.rules.length > 0) {
        category.rules.forEach(rule => {
            const li = document.createElement('li');
            li.innerHTML = `<ion-icon name="checkmark-circle-outline" class="rule-icon"></ion-icon> <span>${rule.description}</span>`;
            ul.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = 'No rules specified for this category.';
        li.style.color = 'var(--text-muted)';
        li.style.listStyle = 'none';
        ul.appendChild(li);
    }

    content.appendChild(ul);

    // Assemble Item
    item.appendChild(header);
    item.appendChild(content);

    // Add Toggle Logic
    header.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        
        // Close all other accordions (Optional behavior)
        document.querySelectorAll('.accordion-item').forEach(acc => {
            acc.classList.remove('active');
            acc.querySelector('.accordion-content').style.maxHeight = null;
        });

        // Toggle current one
        if (!isActive) {
            item.classList.add('active');
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });

    return item;
}

async function loadRules() {
    const categories = await fetchData('/rules/categories/');
    
    const container = document.getElementById('rules-container');
    if (!categories || categories.length === 0) {
        container.innerHTML = '<p style="text-align:center;">No rules found.</p>';
        return;
    }

    categories.forEach(category => {
        const item = createAccordionItem(category);
        container.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadRules();
});
