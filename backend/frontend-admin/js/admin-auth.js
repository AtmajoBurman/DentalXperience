// js/admin-auth.js

// Redirect to login if no token
function enforceAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html';
    }
}

// Global Logout
function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
}

// Convert Google Drive Link to Thumbnail Link
function getDriveThumbnail(url) {
    if (!url) return '';
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=s800`;
    }
    return url;
}

// Authorized Fetch Wrapper
async function fetchAuth(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    
    // Setup default headers
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(endpoint, {
            ...options,
            headers
        });

        // Handle Token Expiration or Invalid
        if (response.status === 401) {
            alert("Session expired. Please login again.");
            logout();
            return null;
        }

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.detail || `Request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("fetchAuth error:", error);
        throw error; // Rethrow to be caught by the caller for UI rendering
    }
}

// Toast Notification System
function showToast(message, type = 'success') {
    let toast = document.getElementById('adminToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'adminToast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.className = `toast show ${type}`;
    const icon = type === 'success' ? 'checkmark-circle' : 'alert-circle';
    toast.innerHTML = `<ion-icon name="${icon}"></ion-icon> <span>${message}</span>`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Setup common UI elements (Logout, Password Modal)
function setupCommonUI() {
    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Change Password Logic
    const pwBtn = document.getElementById('changePasswordBtn');
    const pwModal = document.getElementById('passwordModal');
    const pwClose = document.getElementById('closePasswordModal');
    const pwForm = document.getElementById('passwordForm');

    if (pwBtn && pwModal) {
        pwBtn.addEventListener('click', () => pwModal.classList.add('active'));
        pwClose.addEventListener('click', () => pwModal.classList.remove('active'));
        
        pwForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                showToast("Passwords do not match!", "error");
                return;
            }
            
            const btn = pwForm.querySelector('button[type="submit"]');
            btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Updating...';
            
            try {
                await fetchAuth('/auth/update-password', {
                    method: 'POST',
                    body: JSON.stringify({
                        new_password: newPassword,
                        confirm_password: confirmPassword
                    })
                });
                
                alert("Password changed successfully! Please login with your new password.");
                logout();
            } catch (err) {
                showToast(err.message, "error");
                btn.innerHTML = '<ion-icon name="save-outline"></ion-icon> Update Password';
            }
        });
    }
}

// Run auth check immediately
enforceAuth();
document.addEventListener('DOMContentLoaded', setupCommonUI);
