// js/contact.js

document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('contactTableBody');
    const modal = document.getElementById('contactModal');
    const form = document.getElementById('contactForm');
    const modalTitle = document.getElementById('contactModalTitle');
    
    // Preview Logic
    const picInput = document.getElementById('contactPicture');
    const previewContainer = document.getElementById('contactPreviewContainer');
    const previewImg = document.getElementById('contactPreviewImg');

    picInput.addEventListener('input', () => {
        const val = picInput.value.trim();
        if(val.includes('drive.google.com')) {
            previewImg.src = getDriveThumbnail(val);
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
    });

    // Load Contacts Data
    async function loadContacts() {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
        try {
            const data = await fetchAuth('/contacts/');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted)">No contact entries found.</td></tr>';
                return;
            }

            data.forEach(contact => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-id', contact.id);
                tr.innerHTML = `
                    <td style="cursor: grab; color: var(--text-muted); text-align: center;" class="drag-handle">
                        <ion-icon name="reorder-two-outline" style="font-size: 1.5rem;"></ion-icon>
                    </td>
                    <td><strong>${contact.name}</strong></td>
                    <td><span class="badge">${contact.contact_number}</span></td>
                    <td>
                        ${contact.profile_picture ? 
                          `<img src="${getDriveThumbnail(contact.profile_picture)}" alt="Thumb" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);" referrerpolicy="no-referrer">` :
                          `<span style="color:var(--text-muted)">No picture</span>`
                        }
                    </td>
                    <td>
                        <div style="display:flex; gap: 0.5rem;">
                            <button class="btn-icon edit-btn" data-contact='${JSON.stringify(contact).replace(/'/g, "&apos;")}'>
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                            <button class="btn-icon delete-btn" style="color: var(--danger-color);" onclick="deleteContact(${contact.id})">
                                <ion-icon name="trash-outline"></ion-icon>
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            // Attach edit listeners
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const contactData = JSON.parse(this.getAttribute('data-contact'));
                    openModal(contactData);
                });
            });

            // Initialize Sortable
            Sortable.create(tableBody, {
                handle: '.drag-handle',
                animation: 150,
                onEnd: async function () {
                    const rows = Array.from(tableBody.querySelectorAll('tr[data-id]'));
                    const newOrder = rows.map(r => parseInt(r.getAttribute('data-id')));
                    try {
                        await fetchAuth('/contacts/reorder', {
                            method: 'POST',
                            body: JSON.stringify({ item_ids: newOrder })
                        });
                        showToast("Order saved successfully!", "success");
                    } catch(err) {
                        showToast("Failed to save order", "error");
                        loadContacts(); // reload to reset
                    }
                }
            });

        } catch (err) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--danger-color)">Error loading data.</td></tr>';
        }
    }

    // Delete Contact
    window.deleteContact = async function(id) {
        if (!confirm("Delete this contact entry?")) return;
        try {
            await fetchAuth(`/contacts/${id}`, { method: 'DELETE' });
            showToast("Contact deleted", "success");
            loadContacts();
        } catch(err) {
            showToast(err.message, "error");
        }
    };

    // Modal Control
    document.getElementById('addContactBtn').addEventListener('click', () => openModal());
    document.getElementById('closeContactModal').addEventListener('click', () => modal.classList.remove('active'));

    function openModal(contactData = null) {
        form.reset();
        previewContainer.style.display = 'none';
        
        if (contactData) {
            modalTitle.textContent = "Edit Contact";
            document.getElementById('contactId').value = contactData.id;
            document.getElementById('contactName').value = contactData.name;
            document.getElementById('contactPhone').value = contactData.contact_number;
            document.getElementById('contactPicture').value = contactData.profile_picture || '';
            
            // Trigger preview
            if(contactData.profile_picture) {
                previewImg.src = getDriveThumbnail(contactData.profile_picture);
                previewContainer.style.display = 'block';
            }
        } else {
            modalTitle.textContent = "Add Contact";
            document.getElementById('contactId').value = '';
        }
        
        modal.classList.add('active');
    }

    // Save Form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Saving...';
        
        const id = document.getElementById('contactId').value;
        const picInputVal = document.getElementById('contactPicture').value.trim();
        
        const payload = {
            name: document.getElementById('contactName').value,
            contact_number: document.getElementById('contactPhone').value,
            profile_picture: picInputVal ? picInputVal : null
        };

        try {
            if (id) {
                // Update
                await fetchAuth(`/contacts/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                showToast("Contact updated successfully!", "success");
            } else {
                // Create
                await fetchAuth(`/contacts/`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast("Contact created successfully!", "success");
            }
            modal.classList.remove('active');
            loadContacts();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Save Contact';
        }
    });

    // Initial load
    loadContacts();
});
