// js/introduction.js

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- Profile Form Logic ---
    const form = document.getElementById('introForm');
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
        const response = await fetch('/profile/');
        if (response.ok) {
            const profile = await response.json();
            document.getElementById('chamberName').value = profile.name_of_chamber || '';
            document.getElementById('doctorName').value = profile.name_of_doctor || '';
            document.getElementById('profilePicture').value = profile.doctor_profile_picture || '';
            document.getElementById('mapLink').value = profile.google_maps_location_link || '';
        }
    } catch (err) {
        showToast("Failed to load profile data", "error");
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Saving...';
        
        const payload = {
            name_of_chamber: document.getElementById('chamberName').value,
            name_of_doctor: document.getElementById('doctorName').value,
            doctor_profile_picture: document.getElementById('profilePicture').value,
            google_maps_location_link: document.getElementById('mapLink').value
        };

        try {
            await fetchAuth('/profile/', {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            showToast("Profile information updated successfully!", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            submitBtn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Save Changes';
        }
    });

    // --- Schedule Logic ---
    async function loadSchedule() {
        const container = document.getElementById('scheduleContainer');
        container.innerHTML = '<p>Loading schedule...</p>';
        
        try {
            const response = await fetch('/schedule/');
            if (response.ok) {
                const schedule = await response.json();
                container.innerHTML = '';
                
                schedule.forEach((s) => {
                    const row = document.createElement('div');
                    row.className = 'schedule-row';
                    
                    row.innerHTML = `
                        <div class="schedule-day">${DAYS[s.id - 1] || 'Day ' + s.id}</div>
                        <div class="schedule-inputs">
                            <input type="time" id="from_${s.id}" value="${s.from_time}">
                            <span style="color:var(--text-muted)">to</span>
                            <input type="time" id="to_${s.id}" value="${s.to_time}">
                            <button class="btn-primary" style="padding: 0.5rem 1rem; border-radius: 8px; width: auto;" onclick="updateSchedule(${s.id})">
                                <ion-icon name="save-outline"></ion-icon> Save
                            </button>
                        </div>
                    `;
                    container.appendChild(row);
                });
            }
        } catch (err) {
            container.innerHTML = '<p style="color:var(--danger-color)">Error loading schedule.</p>';
        }
    }

    window.updateSchedule = async function(id) {
        const fromTime = document.getElementById(`from_${id}`).value;
        const toTime = document.getElementById(`to_${id}`).value;
        
        try {
            await fetchAuth(`/schedule/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ from_time: fromTime, to_time: toTime })
            });
            showToast(`${DAYS[id-1]} schedule updated!`, "success");
        } catch(err) {
            showToast(err.message, "error");
        }
    };

    // --- Picture Gallery Logic ---
    async function loadGallery() {
        const container = document.getElementById('galleryContainer');
        container.innerHTML = '<p>Loading pictures...</p>';
        
        try {
            const response = await fetch('/pictures/');
            if (response.ok) {
                const pictures = await response.json();
                container.innerHTML = '';
                
                if (pictures.length === 0) {
                    container.innerHTML = '<p style="color:var(--text-muted)">No pictures found.</p>';
                }
                
                pictures.forEach(pic => {
                    const item = document.createElement('div');
                    item.className = 'gallery-item';
                    
                    const thumbUrl = getDriveThumbnail(pic.url);
                    item.innerHTML = `
                        <img src="${thumbUrl}" alt="Gallery Picture" referrerpolicy="no-referrer">
                        <div class="gallery-actions">
                            <button class="btn-danger" style="padding: 0.5rem; border-radius: 8px;" onclick="deletePicture(${pic.id})">
                                <ion-icon name="trash-outline"></ion-icon> Delete
                            </button>
                        </div>
                    `;
                    container.appendChild(item);
                });
            }
        } catch(err) {
            container.innerHTML = '<p style="color:var(--danger-color)">Error loading gallery.</p>';
        }
    }

    window.deletePicture = async function(id) {
        if(!confirm("Are you sure you want to delete this picture?")) return;
        try {
            await fetchAuth(`/pictures/${id}`, { method: 'DELETE' });
            showToast("Picture deleted!", "success");
            loadGallery();
        } catch(err) {
            showToast(err.message, "error");
        }
    };

    // Modal Logic
    const picModal = document.getElementById('pictureModal');
    const picForm = document.getElementById('pictureForm');
    const picInput = document.getElementById('newPictureUrl');
    const picPreviewContainer = document.getElementById('picturePreviewContainer');
    const picPreviewImg = document.getElementById('picturePreviewImg');

    document.getElementById('addPictureBtn').addEventListener('click', () => {
        picModal.classList.add('active');
        picForm.reset();
        picPreviewContainer.style.display = 'none';
    });
    
    document.getElementById('closePictureModal').addEventListener('click', () => {
        picModal.classList.remove('active');
    });

    // Preview
    picInput.addEventListener('input', () => {
        const val = picInput.value.trim();
        if(val.includes('drive.google.com')) {
            picPreviewImg.src = getDriveThumbnail(val);
            picPreviewContainer.style.display = 'block';
        } else {
            picPreviewContainer.style.display = 'none';
        }
    });

    // Upload
    picForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = picForm.querySelector('button[type="submit"]');
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Uploading...';
        
        try {
            await fetchAuth('/pictures/', {
                method: 'POST',
                body: JSON.stringify({ url: picInput.value.trim() })
            });
            showToast("Picture added to gallery!", "success");
            picModal.classList.remove('active');
            loadGallery();
        } catch(err) {
            showToast(err.message, "error");
        } finally {
            btn.innerHTML = '<ion-icon name="cloud-upload-outline"></ion-icon> Upload Picture';
        }
    });

    // Initial Loads
    loadSchedule();
    loadGallery();

    // --- Registered Customers Logic ---
    const viewCustomersBtn = document.getElementById('viewCustomersBtn');
    const customersListContainer = document.getElementById('customersListContainer');
    const customersCount = document.getElementById('customersCount');
    const customersList = document.getElementById('customersList');

    if (viewCustomersBtn) {
        viewCustomersBtn.addEventListener('click', async () => {
            viewCustomersBtn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Loading...';
            try {
                const data = await fetchAuth('/customers/');
                
                customersList.innerHTML = '';
                if (data && data.length > 0) {
                    customersCount.textContent = `Total: ${data.length}`;
                    data.forEach(c => {
                        const li = document.createElement('li');
                        li.textContent = c.email_address;
                        li.style.padding = '0.5rem 0';
                        li.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                        customersList.appendChild(li);
                    });
                } else {
                    customersCount.textContent = 'Total: 0';
                    customersList.innerHTML = '<li>No registered customers found.</li>';
                }
                
                customersListContainer.style.display = 'block';
                viewCustomersBtn.innerHTML = '<ion-icon name="mail-unread-outline"></ion-icon> Refresh Registered Emails';
            } catch (err) {
                showToast("Failed to load customers", "error");
                viewCustomersBtn.innerHTML = '<ion-icon name="mail-unread-outline"></ion-icon> View Registered Emails';
            }
        });
    }
});
