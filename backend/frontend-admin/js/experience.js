// js/experience.js

document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('experienceTableBody');
    const modal = document.getElementById('expModal');
    const form = document.getElementById('expForm');
    const modalTitle = document.getElementById('expModalTitle');
    
    // Preview Logic
    const picInput = document.getElementById('expPictureLink');
    const previewContainer = document.getElementById('expPreviewContainer');
    const previewImg = document.getElementById('expPreviewImg');

    picInput.addEventListener('input', () => {
        const val = picInput.value.trim();
        if(val.includes('drive.google.com')) {
            previewImg.src = getDriveThumbnail(val);
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
    });

    // Load Experience Data
    async function loadExperience() {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
        try {
            const data = await fetchAuth('/experience/');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">No experience entries found.</td></tr>';
                return;
            }

            data.forEach(exp => {
                const tr = document.createElement('tr');
                tr.setAttribute('data-id', exp.id);
                const startYear = exp.exp_start ? new Date(exp.exp_start).getFullYear() : '';
                const endYear = exp.exp_end ? new Date(exp.exp_end).getFullYear() : 'Present';
                
                tr.innerHTML = `
                    <td style="cursor: grab; color: var(--text-muted); text-align: center;" class="drag-handle">
                        <ion-icon name="reorder-two-outline" style="font-size: 1.5rem;"></ion-icon>
                    </td>
                    <td><strong>${exp.heading}</strong></td>
                    <td><span class="badge">${exp.experience_category}</span></td>
                    <td>${startYear} - ${endYear}</td>
                    <td>
                        ${exp.picture_link ? 
                          `<img src="${getDriveThumbnail(exp.picture_link)}" alt="Thumb" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);" referrerpolicy="no-referrer">` :
                          `<span style="color:var(--text-muted)">No picture</span>`
                        }
                    </td>
                    <td><div style="display:flex; gap: 0.5rem;">
                            <button class="btn-icon edit-btn" data-exp='${JSON.stringify(exp).replace(/'/g, "&apos;")}'>
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                            <button class="btn-icon delete-btn" style="color: var(--danger-color);" onclick="deleteExp(${exp.id})">
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
                    const expData = JSON.parse(this.getAttribute('data-exp'));
                    openModal(expData);
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
                        await fetchAuth('/experience/reorder', {
                            method: 'POST',
                            body: JSON.stringify({ item_ids: newOrder })
                        });
                        showToast("Order saved successfully!", "success");
                    } catch(err) {
                        showToast("Failed to save order", "error");
                        loadExperience(); // reload to reset
                    }
                }
            });

        } catch (err) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--danger-color)">Error loading data.</td></tr>';
        }
    }

    // Delete Experience
    window.deleteExp = async function(id) {
        if (!confirm("Delete this experience entry?")) return;
        try {
            await fetchAuth(`/experience/${id}`, { method: 'DELETE' });
            showToast("Experience deleted", "success");
            loadExperience();
        } catch(err) {
            showToast(err.message, "error");
        }
    };

    // Modal Control
    document.getElementById('addExpBtn').addEventListener('click', () => openModal());
    document.getElementById('closeExpModal').addEventListener('click', () => modal.classList.remove('active'));

    function openModal(expData = null) {
        form.reset();
        previewContainer.style.display = 'none';
        
        if (expData) {
            modalTitle.textContent = "Edit Experience";
            document.getElementById('expId').value = expData.id;
            document.getElementById('expHeading').value = expData.heading;
            document.getElementById('expCategory').value = expData.experience_category;
            document.getElementById('expStart').value = expData.exp_start;
            document.getElementById('expEnd').value = expData.exp_end || '';
            document.getElementById('expPictureLink').value = expData.picture_link;
            document.getElementById('expDescription').value = expData.description;
            
            // Trigger preview
            if(expData.picture_link) {
                previewImg.src = getDriveThumbnail(expData.picture_link);
                previewContainer.style.display = 'block';
            }
        } else {
            modalTitle.textContent = "Add New Experience";
            document.getElementById('expId').value = '';
        }
        
        modal.classList.add('active');
    }

    // Save Form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Saving...';
        
        const id = document.getElementById('expId').value;
        const payload = {
            heading: document.getElementById('expHeading').value,
            experience_category: document.getElementById('expCategory').value,
            exp_start: document.getElementById('expStart').value,
            exp_end: document.getElementById('expEnd').value || null,
            picture_link: document.getElementById('expPictureLink').value,
            description: document.getElementById('expDescription').value
        };

        try {
            if (id) {
                // Update
                await fetchAuth(`/experience/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                showToast("Experience updated successfully!", "success");
            } else {
                // Create
                await fetchAuth(`/experience/`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast("Experience created successfully!", "success");
            }
            modal.classList.remove('active');
            loadExperience();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Save Experience';
        }
    });

    // Initial load
    loadExperience();
});
