// js/staff.js

document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('staffTableBody');
    const modal = document.getElementById('staffModal');
    const form = document.getElementById('staffForm');
    const modalTitle = document.getElementById('staffModalTitle');
    
    // Preview Logic
    const picInput = document.getElementById('staffPicture');
    const previewContainer = document.getElementById('staffPreviewContainer');
    const previewImg = document.getElementById('staffPreviewImg');

    picInput.addEventListener('input', () => {
        const val = picInput.value.trim();
        if(val.includes('drive.google.com')) {
            previewImg.src = getDriveThumbnail(val);
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
    });

    // Load Staff Data
    async function loadStaff() {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
        try {
            const data = await fetchAuth('/staff/');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">No staff members found.</td></tr>';
                return;
            }

            data.forEach(member => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-id', member.id);
                const startYear = member.from_date ? new Date(member.from_date).getFullYear() : '';
                const endYear = member.till_date ? new Date(member.till_date).getFullYear() : 'Present';
                
                tr.innerHTML = `
                    <td style="cursor: grab; color: var(--text-muted); text-align: center;" class="drag-handle">
                        <ion-icon name="reorder-two-outline" style="font-size: 1.5rem;"></ion-icon>
                    </td>
                    <td><strong>${member.name}</strong></td>
                    <td>${member.phone_number ? `<span class="badge">${member.phone_number}</span>` : `<span style="color:var(--text-muted)">N/A</span>`}</td>
                    <td>${startYear} - ${endYear}</td>
                    <td>
                        <img src="${getDriveThumbnail(member.profile_picture)}" alt="Thumb" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);" referrerpolicy="no-referrer">
                    </td>
                    <td>
                        <div style="display:flex; gap: 0.5rem;">
                            <button class="btn-icon edit-btn" data-staff='${JSON.stringify(member).replace(/'/g, "&apos;")}'>
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                            <button class="btn-icon delete-btn" style="color: var(--danger-color);" onclick="deleteStaff(${member.id})">
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
                    const memberData = JSON.parse(this.getAttribute('data-staff'));
                    openModal(memberData);
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
                        await fetchAuth('/staff/reorder', {
                            method: 'POST',
                            body: JSON.stringify({ item_ids: newOrder })
                        });
                        showToast("Order saved successfully!", "success");
                    } catch(err) {
                        showToast("Failed to save order", "error");
                        loadStaff(); // reload to reset
                    }
                }
            });

        } catch (err) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--danger-color)">Error loading data.</td></tr>';
        }
    }

    // Delete Staff
    window.deleteStaff = async function(id) {
        if (!confirm("Delete this staff member?")) return;
        try {
            await fetchAuth(`/staff/${id}`, { method: 'DELETE' });
            showToast("Staff member deleted", "success");
            loadStaff();
        } catch(err) {
            showToast(err.message, "error");
        }
    };

    // Modal Control
    document.getElementById('addStaffBtn').addEventListener('click', () => openModal());
    document.getElementById('closeStaffModal').addEventListener('click', () => modal.classList.remove('active'));

    function openModal(memberData = null) {
        form.reset();
        previewContainer.style.display = 'none';
        
        if (memberData) {
            modalTitle.textContent = "Edit Staff Member";
            document.getElementById('staffId').value = memberData.id;
            document.getElementById('staffName').value = memberData.name;
            document.getElementById('staffPhone').value = memberData.phone_number || '';
            document.getElementById('staffStart').value = memberData.from_date;
            document.getElementById('staffEnd').value = memberData.till_date || '';
            document.getElementById('staffPicture').value = memberData.profile_picture;
            document.getElementById('staffDescription').value = memberData.description;
            
            // Trigger preview
            if(memberData.profile_picture) {
                previewImg.src = getDriveThumbnail(memberData.profile_picture);
                previewContainer.style.display = 'block';
            }
        } else {
            modalTitle.textContent = "Add Staff Member";
            document.getElementById('staffId').value = '';
        }
        
        modal.classList.add('active');
    }

    // Save Form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Saving...';
        
        const id = document.getElementById('staffId').value;
        const phoneInput = document.getElementById('staffPhone').value.trim();
        
        const payload = {
            name: document.getElementById('staffName').value,
            phone_number: phoneInput ? phoneInput : null,
            from_date: document.getElementById('staffStart').value,
            till_date: document.getElementById('staffEnd').value || null,
            profile_picture: document.getElementById('staffPicture').value,
            description: document.getElementById('staffDescription').value
        };

        try {
            if (id) {
                // Update
                await fetchAuth(`/staff/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                showToast("Staff updated successfully!", "success");
            } else {
                // Create
                await fetchAuth(`/staff/`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast("Staff member added successfully!", "success");
            }
            modal.classList.remove('active');
            loadStaff();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Save Staff Member';
        }
    });

    // Initial load
    loadStaff();
});
