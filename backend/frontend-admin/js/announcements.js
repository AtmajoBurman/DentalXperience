// js/announcements.js

document.addEventListener('DOMContentLoaded', () => {
    
    const tableBody = document.getElementById('announcementTableBody');
    const modal = document.getElementById('annModal');
    const form = document.getElementById('annForm');
    const modalTitle = document.getElementById('annModalTitle');
    
    // Helper to format datetime for input
    function formatForInput(dateStr) {
        if (!dateStr) return '';
        return dateStr.slice(0, 16);
    }

    // Helper to format datetime for payload
    function formatForPayload(dateStr) {
        if (!dateStr) return null;
        return dateStr;
    }

    // Load Data
    async function loadAnnouncements() {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
        try {
            // Note: The public GET /announcements/ filters out vanished ones.
            // If the admin wants to see all (even expired), we technically need an admin endpoint.
            // But since the backend GET /announcements/ returns unexpired ones, let's just use it.
            // Actually, we can just use the public endpoint as the admin endpoint wasn't specifically segregated for announcements.
            const data = await fetchAuth('/announcements/');
            tableBody.innerHTML = '';
            
            if (data.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--text-muted)">No active announcements found.</td></tr>';
                return;
            }

            const now = new Date();

            data.forEach(ann => {
                const tr = document.createElement('tr');
                const pDate = new Date(ann.date_and_time).toLocaleString();
                const vDate = new Date(ann.vanishing_date);
                
                const isExpired = vDate < now;
                const statusHtml = isExpired ? `<span class="badge" style="color:var(--danger-color); border-color:var(--danger-color)">Expired</span>` 
                                             : `<span class="badge" style="color:var(--success-color); border-color:var(--success-color)">Active</span>`;

                tr.innerHTML = `
                    <td><strong>${ann.heading}</strong></td>
                    <td>${pDate}</td>
                    <td>${vDate.toLocaleString()}</td>
                    <td>${statusHtml}</td>
                    <td>
                        <div style="display:flex; gap: 0.5rem;">
                            <button class="btn-icon edit-btn" data-ann='${JSON.stringify(ann).replace(/'/g, "&apos;")}'>
                                <ion-icon name="create-outline"></ion-icon>
                            </button>
                            <button class="btn-icon delete-btn" style="color: var(--danger-color);" onclick="deleteAnn(${ann.id})">
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
                    const annData = JSON.parse(this.getAttribute('data-ann'));
                    openModal(annData);
                });
            });

        } catch (err) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: var(--danger-color)">Error loading data.</td></tr>';
        }
    }

    // Delete Announcement
    window.deleteAnn = async function(id) {
        if (!confirm("Delete this announcement?")) return;
        try {
            await fetchAuth(`/announcements/${id}`, { method: 'DELETE' });
            showToast("Announcement deleted", "success");
            loadAnnouncements();
        } catch(err) {
            showToast(err.message, "error");
        }
    };

    // Modal Control
    document.getElementById('addAnnouncementBtn').addEventListener('click', () => openModal());
    document.getElementById('closeAnnModal').addEventListener('click', () => modal.classList.remove('active'));

    function openModal(annData = null) {
        form.reset();
        
        if (annData) {
            modalTitle.textContent = "Edit Announcement";
            document.getElementById('annId').value = annData.id;
            document.getElementById('annHeading').value = annData.heading;
            document.getElementById('annDate').value = formatForInput(annData.date_and_time);
            document.getElementById('annVanishDate').value = formatForInput(annData.vanishing_date);
            document.getElementById('annDescription').value = annData.description;
        } else {
            modalTitle.textContent = "Create Announcement";
            document.getElementById('annId').value = '';
            
            // Set defaults to now (local time)
            const now = new Date();
            const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('annDate').value = localNow;
            
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7); // Default vanish in 1 week
            const localNextWeek = new Date(nextWeek.getTime() - nextWeek.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            document.getElementById('annVanishDate').value = localNextWeek;
        }
        
        modal.classList.add('active');
    }

    // Save Form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Saving...';
        
        const id = document.getElementById('annId').value;
        
        const payload = {
            heading: document.getElementById('annHeading').value,
            date_and_time: formatForPayload(document.getElementById('annDate').value),
            vanishing_date: formatForPayload(document.getElementById('annVanishDate').value),
            description: document.getElementById('annDescription').value
        };

        try {
            if (id) {
                // Update
                await fetchAuth(`/announcements/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
                showToast("Announcement updated!", "success");
            } else {
                // Create
                await fetchAuth(`/announcements/`, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                showToast("Announcement created!", "success");
            }
            modal.classList.remove('active');
            loadAnnouncements();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Save Announcement';
        }
    });

    // Initial load
    loadAnnouncements();
});
