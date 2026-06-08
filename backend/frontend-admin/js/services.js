document.addEventListener('DOMContentLoaded', () => {
    const serviceForm = document.getElementById('serviceForm');
    const servicesList = document.getElementById('servicesList');
    
    const editModal = document.getElementById('editModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const editForm = document.getElementById('editForm');
    
    let services = [];

    // Toast Notification System
    const showToast = (message, type = 'success') => {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            document.body.appendChild(toast);
        }
        
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline';
        toast.innerHTML = `<ion-icon name="${icon}"></ion-icon> ${message}`;
        
        // Force reflow
        void toast.offsetWidth;
        
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // Fetch and display services
    const loadServices = async () => {
        try {
            const res = await fetch('/services/');
            if (!res.ok) throw new Error('Failed to fetch services');
            services = await res.json();
            renderServices();
        } catch (err) {
            console.error(err);
            alert('Could not load services.');
        }
    };

    const renderServices = () => {
        servicesList.innerHTML = '';
        if (services.length === 0) {
            servicesList.innerHTML = '<p style="color: var(--text-muted);">No services found.</p>';
            return;
        }

        services.forEach(service => {
            const item = document.createElement('div');
            item.className = 'service-item';
            item.dataset.id = service.id;
            
            item.innerHTML = `
                <div class="drag-handle"><ion-icon name="menu-outline"></ion-icon></div>
                <div class="service-content">
                    <h4>${service.service_name}</h4>
                    <p>${service.service_provided}</p>
                </div>
                <div class="actions">
                    <button class="btn-icon edit-btn" data-id="${service.id}">
                        <ion-icon name="create-outline"></ion-icon>
                    </button>
                    <button class="btn-icon delete-btn" data-id="${service.id}">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            `;
            servicesList.appendChild(item);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteService(btn.dataset.id));
        });
    };

    // Initialize Sortable
    new Sortable(servicesList, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: async () => {
            const items = document.querySelectorAll('.service-item');
            const serviceIds = Array.from(items).map(item => parseInt(item.dataset.id));

            try {
                const res = await fetch('/services/reorder/', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({ service_ids: serviceIds })
                });

                if (res.ok) {
                    showToast('Order saved successfully!');
                } else if (res.status === 401) {
                    window.location.href = 'index.html';
                } else {
                    alert('Failed to reorder services.');
                    loadServices();
                }
            } catch (err) {
                console.error(err);
                alert('Network error while reordering.');
                loadServices();
            }
        }
    });

    // Create Service
    serviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            service_name: document.getElementById('serviceName').value,
            service_provided: document.getElementById('serviceProvided').value
        };

        try {
            const res = await fetch('/services/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                serviceForm.reset();
                showToast('Service added successfully');
                loadServices();
            } else if (res.status === 401) {
                window.location.href = 'index.html';
            } else {
                alert('Failed to create service.');
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Delete Service
    const deleteService = async (id) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        try {
            const res = await fetch(`/services/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (res.ok) {
                loadServices();
            } else if (res.status === 401) {
                window.location.href = 'index.html';
            } else {
                alert('Failed to delete service.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Edit Service
    const openEditModal = (id) => {
        const service = services.find(s => s.id == id);
        if (!service) return;

        document.getElementById('editServiceId').value = service.id;
        document.getElementById('editServiceName').value = service.service_name;
        document.getElementById('editServiceProvided').value = service.service_provided;
        
        editModal.classList.add('active');
    };

    closeEditModal.addEventListener('click', () => {
        editModal.classList.remove('active');
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editServiceId').value;
        const data = {
            service_name: document.getElementById('editServiceName').value,
            service_provided: document.getElementById('editServiceProvided').value
        };

        try {
            const res = await fetch(`/services/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                editModal.classList.remove('active');
                showToast('Service updated successfully');
                loadServices();
            } else if (res.status === 401) {
                window.location.href = 'index.html';
            } else {
                alert('Failed to update service.');
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Initial load
    loadServices();
});
