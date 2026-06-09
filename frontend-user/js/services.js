document.addEventListener('DOMContentLoaded', async () => {
    const servicesContainer = document.getElementById('services-container');

    // Fetch services from the backend
    try {
        const response = await fetch(`${API_BASE}/services/`);
        if (!response.ok) {
            throw new Error('Failed to fetch services');
        }
        const services = await response.json();
        
        if (services.length === 0) {
            servicesContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No services available at the moment.</p>';
            return;
        }

        // Render services
        services.forEach(service => {
            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';

            accordionItem.innerHTML = `
                <div class="accordion-header">
                    <h3>${service.service_name}</h3>
                    <ion-icon name="chevron-down-outline" class="accordion-icon"></ion-icon>
                </div>
                <div class="accordion-body">
                    <div class="accordion-content">
                        <div class="accordion-inner">
                            ${service.service_provided}
                        </div>
                    </div>
                </div>
            `;

            const header = accordionItem.querySelector('.accordion-header');
            const body = accordionItem.querySelector('.accordion-body');

            header.addEventListener('click', () => {
                const isActive = accordionItem.classList.contains('active');
                
                // Close all other items
                document.querySelectorAll('.accordion-item').forEach(item => {
                    item.classList.remove('active');
                    const contentWrap = item.querySelector('.accordion-content');
                    if (contentWrap) contentWrap.style.maxHeight = null;
                });

                // If it wasn't active, open it
                if (!isActive) {
                    accordionItem.classList.add('active');
                    const contentWrap = accordionItem.querySelector('.accordion-content');
                    if (contentWrap) {
                        contentWrap.style.maxHeight = contentWrap.scrollHeight + "px";
                    }
                }
            });

            servicesContainer.appendChild(accordionItem);
        });

    } catch (error) {
        console.error('Error fetching services:', error);
        servicesContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Could not load services.</p>';
    }
});
