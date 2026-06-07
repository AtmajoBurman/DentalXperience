

// Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navbar = document.getElementById('navbar');

navToggle.addEventListener('click', () => {
    navbar.classList.toggle('open');
});

// Utility to fetch data
async function fetchData(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return null;
    }
}

// Convert Google Drive Link to Thumbnail Link
function getDriveThumbnail(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=s800`;
    }
    return url;
}

// Initialize Profile (Hero section)
async function initProfile() {
    const profile = await fetchData('/profile/');
    if (profile && profile.name_of_chamber) {
        const nameEl = document.getElementById('chamber-name');
        if (nameEl) {
            nameEl.textContent = profile.name_of_chamber || "Welcome to Our Chamber";
        }
        
        const mapLink = document.getElementById('map-link');
        if (profile.google_maps_location_link && mapLink) {
            mapLink.href = profile.google_maps_location_link;
        }
    }
}

// Initialize Slideshow
async function initGallery() {
    const pictures = await fetchData('/pictures/');
    const slideshow = document.getElementById('slideshow');
    
    if (!slideshow) return;

    if (pictures && pictures.length > 0) {
        // Build images
        pictures.forEach((pic, index) => {
            const img = document.createElement('img');
            img.src = getDriveThumbnail(pic.url);
            img.setAttribute('referrerpolicy', 'no-referrer');
            img.alt = "Clinic Image";
            img.classList.add('slide');
            if (index === 0) img.classList.add('active');
            slideshow.appendChild(img);
        });

        // Slideshow logic
        const slides = document.querySelectorAll('.slide');
        if(slides.length > 1) {
            let currentIndex = 0;
            setInterval(() => {
                slides[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % slides.length;
                slides[currentIndex].classList.add('active');
            }, 4000); // Fades every 4 seconds
        }
    } else {
        const fallback = document.createElement('div');
        fallback.textContent = "No pictures available.";
        fallback.style.padding = "2rem";
        fallback.style.textAlign = "center";
        slideshow.appendChild(fallback);
    }
}

const dayMap = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday'
};

// Initialize Schedule
async function initSchedule() {
    const schedules = await fetchData('/schedule/');
    const tbody = document.getElementById('schedule-body');
    
    if (!tbody) return;

    if (schedules && schedules.length > 0) {
        // Sort by day ID
        schedules.sort((a, b) => a.id - b.id);
        
        schedules.forEach(sched => {
            const tr = document.createElement('tr');
            
            const tdDay = document.createElement('td');
            tdDay.textContent = dayMap[sched.id] || `Day ${sched.id}`;
            
            const tdOpen = document.createElement('td');
            tdOpen.textContent = sched.from_time;
            
            const tdClose = document.createElement('td');
            tdClose.textContent = sched.to_time;
            
            tr.appendChild(tdDay);
            tr.appendChild(tdOpen);
            tr.appendChild(tdClose);
            tbody.appendChild(tr);
        });
    } else {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.textContent = "No schedule found.";
        td.style.textAlign = "center";
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
}

// Run all initializations
document.addEventListener('DOMContentLoaded', () => {
    initProfile();
    initGallery();
    initSchedule();
    checkUpcomingAnnouncements();
});

// Check for upcoming announcements
async function checkUpcomingAnnouncements() {
    const popup = document.getElementById('upcoming-popup');
    const dismissBtn = document.getElementById('dismissPopupBtn');
    
    // Only run this logic on a page that has the popup (index.html)
    if (!popup || !dismissBtn) return;

    // Check localStorage if already dismissed
    if (localStorage.getItem('announcementsDismissed') === 'true') {
        return;
    }

    const arr = await fetchData('/announcements/');
    if (!arr || arr.length === 0) return;

    const now = new Date();
    // Check if any announcement is strictly in the future
    const hasUpcoming = arr.some(ann => new Date(ann.date_and_time) > now);

    if (hasUpcoming) {
        // Show after a small delay for smooth animation
        setTimeout(() => {
            popup.classList.add('show');
        }, 1500);
    }

    dismissBtn.addEventListener('click', () => {
        popup.classList.remove('show');
        localStorage.setItem('announcementsDismissed', 'true');
    });
}

// --- OTP Registration Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject Modal HTML
    const modalHTML = `
        <div class="reg-modal-overlay" id="regModalOverlay">
            <div class="reg-modal">
                <button class="reg-btn-close" id="regCloseBtn"><ion-icon name="close-outline"></ion-icon></button>
                
                <div id="regStep1">
                    <h2>Register with Us</h2>
                    <p>Enter your email to receive an OTP</p>
                    <form id="regEmailForm">
                        <input type="email" id="regEmailInput" placeholder="your@email.com" required>
                        <button type="submit" class="btn-primary" id="regEmailSubmitBtn">Send OTP</button>
                    </form>
                    <div id="regSuccessBox" class="reg-success-box">This email is already registered with us.</div>
                    <a class="unregister-link" id="showUnregBtn">Unregister from us</a>
                </div>

                <div id="regStep2" style="display: none;">
                    <h2>Verify OTP</h2>
                    <p>Enter the 6-digit code sent to <br><strong id="regEmailDisplay"></strong></p>
                    <form id="regOtpForm">
                        <input type="text" id="regOtpInput" placeholder="Enter 6-digit OTP" required maxlength="6">
                        <button type="submit" class="btn-primary" id="regOtpSubmitBtn">Verify</button>
                    </form>
                    <div id="regTimer" class="reg-timer">Expires in: <span id="regCountdown">05:00</span></div>
                    <a class="reg-resend-link" id="regResendLink" style="display: none;">Resend OTP</a>
                </div>
                
                <div id="regStep3" style="display: none;">
                    <h2>Success!</h2>
                    <p style="color: #10b981; margin-bottom:0;">You are successfully registered.</p>
                </div>

                <div id="unregStep1" style="display: none;">
                    <h2>Unregister</h2>
                    <p>Enter your registered email</p>
                    <form id="unregEmailForm">
                        <input type="email" id="unregEmailInput" placeholder="your@email.com" required>
                        <button type="submit" class="btn-primary" id="unregEmailSubmitBtn">Send OTP</button>
                    </form>
                    <div id="unregErrorBox" class="unreg-error-box">We did not find this email registered with us</div>
                </div>

                <div id="unregStep2" style="display: none;">
                    <h2>Verify OTP</h2>
                    <p>Enter the 6-digit code sent to <br><strong id="unregEmailDisplay"></strong></p>
                    <form id="unregOtpForm">
                        <input type="text" id="unregOtpInput" placeholder="Enter 6-digit OTP" required maxlength="6">
                        <button type="submit" class="btn-primary" id="unregOtpSubmitBtn">Unregister</button>
                    </form>
                    <div id="unregTimer" class="reg-timer">Expires in: <span id="unregCountdown">05:00</span></div>
                    <a class="reg-resend-link" id="unregResendLink" style="display: none;">Resend OTP</a>
                </div>

                <div id="unregStep3" style="display: none;">
                    <h2 style="color: #e74c3c;">Unregistered</h2>
                    <p style="margin-bottom:15px; color:#10b981; font-weight:600;">Your email has been successfully unregistered.</p>
                    <p style="font-size: 0.95rem;">We are sorry to see you go, could you please tell what went wrong so that we can improve ourselves?</p>
                    <form id="feedbackForm">
                        <textarea id="feedbackInput" class="feedback-textarea" placeholder="Your feedback..." required></textarea>
                        <button type="submit" class="btn-primary" id="feedbackSubmitBtn">Send Feedback</button>
                    </form>
                </div>
                
                <div id="feedbackSuccess" style="display: none;">
                    <h2>Thank You</h2>
                    <p style="color: #10b981; margin-bottom:0;">Thank you for your response!</p>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const overlay = document.getElementById('regModalOverlay');
    const closeBtn = document.getElementById('regCloseBtn');
    const emailForm = document.getElementById('regEmailForm');
    const otpForm = document.getElementById('regOtpForm');
    const successBox = document.getElementById('regSuccessBox');
    
    // Unregister elements
    const showUnregBtn = document.getElementById('showUnregBtn');
    const unregEmailForm = document.getElementById('unregEmailForm');
    const unregOtpForm = document.getElementById('unregOtpForm');
    const feedbackForm = document.getElementById('feedbackForm');
    const unregErrorBox = document.getElementById('unregErrorBox');
    
    let currentEmail = '';
    let countdownInterval;

    // Reset Modal State
    function resetModal() {
        ['regStep1', 'regStep2', 'regStep3', 'unregStep1', 'unregStep2', 'unregStep3', 'feedbackSuccess'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        successBox.style.display = 'none';
        unregErrorBox.style.display = 'none';
        emailForm.reset();
        otpForm.reset();
        unregEmailForm.reset();
        unregOtpForm.reset();
        feedbackForm.reset();
        clearInterval(countdownInterval);
    }

    // Attach to Register buttons
    document.querySelectorAll('#registerBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            resetModal();
            overlay.classList.add('active');
            document.getElementById('regStep1').style.display = 'block';
        });
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        resetModal();
    });
    
    showUnregBtn.addEventListener('click', () => {
        resetModal();
        document.getElementById('unregStep1').style.display = 'block';
    });

    // Step 1: Send OTP
    emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('regEmailSubmitBtn');
        const email = document.getElementById('regEmailInput').value;
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Sending...';
        btn.disabled = true;
        successBox.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE}/register/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (res.ok) {
                currentEmail = email;
                document.getElementById('regEmailDisplay').innerText = email;
                document.getElementById('regStep1').style.display = 'none';
                document.getElementById('regStep2').style.display = 'block';
                startCountdown(5 * 60);
            } else {
                if (data.registered) {
                    successBox.style.display = 'block';
                    successBox.innerText = data.message;
                } else {
                    alert(data.message || 'Failed to request OTP');
                }
            }
        } catch (err) {
            alert('Network error');
        } finally {
            btn.innerHTML = 'Send OTP';
            btn.disabled = false;
        }
    });

    // Step 2: Verify OTP
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('regOtpSubmitBtn');
        const otp = document.getElementById('regOtpInput').value;
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Verifying...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/register/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, otp })
            });
            const data = await res.json();

            if (res.ok) {
                document.getElementById('regStep2').style.display = 'none';
                document.getElementById('regStep3').style.display = 'block';
                clearInterval(countdownInterval);
                setTimeout(() => overlay.classList.remove('active'), 2000);
            } else {
                alert(data.message || 'Verification failed');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            btn.innerHTML = 'Verify';
            btn.disabled = false;
        }
    });

    // Resend OTP logic
    document.getElementById('regResendLink').addEventListener('click', async () => {
        document.getElementById('regResendLink').style.display = 'none';
        document.getElementById('regTimer').style.display = 'block';
        startCountdown(5 * 60);
        
        try {
            await fetch(`${API_BASE}/register/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail })
            });
        } catch (err) {}
    });

    function startCountdown(duration, displayId = 'regCountdown', timerId = 'regTimer', resendId = 'regResendLink') {
        clearInterval(countdownInterval);
        const display = document.getElementById(displayId);
        const timerDiv = document.getElementById(timerId);
        const resendLink = document.getElementById(resendId);
        resendLink.style.display = 'none';
        timerDiv.style.display = 'block';
        
        let timer = duration, minutes, seconds;
        countdownInterval = setInterval(function () {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;
            display.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(countdownInterval);
                timerDiv.style.display = 'none';
                resendLink.style.display = 'block';
            }
        }, 1000);
    }
    
    // --- Unregister Flow ---
    
    unregEmailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('unregEmailSubmitBtn');
        const email = document.getElementById('unregEmailInput').value;
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Sending...';
        btn.disabled = true;
        unregErrorBox.style.display = 'none';

        try {
            const res = await fetch(`${API_BASE}/register/request-unregister-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            
            if (res.ok) {
                currentEmail = email;
                document.getElementById('unregEmailDisplay').innerText = email;
                document.getElementById('unregStep1').style.display = 'none';
                document.getElementById('unregStep2').style.display = 'block';
                startCountdown(5 * 60, 'unregCountdown', 'unregTimer', 'unregResendLink');
            } else {
                if (res.status === 404) {
                    unregErrorBox.style.display = 'block';
                    unregErrorBox.innerText = data.message;
                } else {
                    alert(data.message || 'Failed to request OTP');
                }
            }
        } catch (err) {
            alert('Network error');
        } finally {
            btn.innerHTML = 'Send OTP';
            btn.disabled = false;
        }
    });

    unregOtpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('unregOtpSubmitBtn');
        const otp = document.getElementById('unregOtpInput').value;
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Verifying...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/register/verify-unregister-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, otp })
            });
            const data = await res.json();

            if (res.ok) {
                document.getElementById('unregStep2').style.display = 'none';
                document.getElementById('unregStep3').style.display = 'block';
                clearInterval(countdownInterval);
            } else {
                alert(data.message || 'Verification failed');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            btn.innerHTML = 'Unregister';
            btn.disabled = false;
        }
    });

    document.getElementById('unregResendLink').addEventListener('click', async () => {
        document.getElementById('unregResendLink').style.display = 'none';
        document.getElementById('unregTimer').style.display = 'block';
        startCountdown(5 * 60, 'unregCountdown', 'unregTimer', 'unregResendLink');
        
        try {
            await fetch(`${API_BASE}/register/request-unregister-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail })
            });
        } catch (err) {}
    });

    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('feedbackSubmitBtn');
        const feedback = document.getElementById('feedbackInput').value;
        
        if (!feedback.trim()) {
            alert('Feedback cannot be empty.');
            return;
        }
        
        btn.innerHTML = '<ion-icon name="sync-outline" class="spin"></ion-icon> Sending...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/register/submit-feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentEmail, feedback })
            });
            
            if (res.ok) {
                document.getElementById('unregStep3').style.display = 'none';
                document.getElementById('feedbackSuccess').style.display = 'block';
                setTimeout(() => {
                    overlay.classList.remove('active');
                    resetModal();
                }, 3000);
            } else {
                alert('Failed to send feedback');
            }
        } catch (err) {
            alert('Network error');
        } finally {
            btn.innerHTML = 'Send Feedback';
            btn.disabled = false;
        }
    });
});

// --- Chatbot Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const chatbotCSS = `
        .chat-modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(5px);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 3000;
        }
        .chat-modal-overlay.active {
            display: flex;
        }
        .chat-modal {
            background: var(--primary-color);
            width: 90%;
            max-width: 400px;
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2);
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .chat-close-btn {
            position: absolute;
            top: 15px; right: 15px;
            background: transparent;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--text-muted);
        }
        .chat-messages {
            height: 300px;
            overflow-y: auto;
            border: 1px solid var(--glass-border);
            border-radius: 10px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.5);
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .chat-msg {
            padding: 10px 15px;
            border-radius: 15px;
            max-width: 80%;
            word-wrap: break-word;
        }
        .chat-msg.user {
            background: var(--accent-color);
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 0;
        }
        .chat-msg.bot {
            background: white;
            color: var(--text-main);
            align-self: flex-start;
            border-bottom-left-radius: 0;
            box-shadow: var(--shadow-soft);
        }
        .chat-input-area {
            display: flex;
            gap: 10px;
        }
        .chat-input-area input {
            flex: 1;
            padding: 12px;
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            outline: none;
        }
        .chat-input-area button {
            background: var(--accent-color);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: bold;
        }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = chatbotCSS;
    document.head.appendChild(styleSheet);

    const chatModalHTML = `
        <div class="chat-modal-overlay" id="chatModalOverlay">
            <div class="chat-modal">
                <button class="chat-close-btn" id="chatCloseBtn"><ion-icon name="close-outline"></ion-icon></button>
                <h3 style="margin-top:0; color:var(--text-main);">Clinic Support</h3>
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-msg bot">Hello! How can I help you today?</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chatInput" placeholder="Type your query..." />
                    <button id="chatSendBtn">Send</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatModalHTML);

    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatOverlay = document.getElementById('chatModalOverlay');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    if(chatbotBtn) {
        chatbotBtn.addEventListener('click', () => {
            chatOverlay.classList.add('active');
        });
    }

    chatCloseBtn.addEventListener('click', () => {
        chatOverlay.classList.remove('active');
    });

    const addMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-msg', sender);
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const sendMessage = async () => {
        const query = chatInput.value.trim();
        if(!query) return;

        addMessage(query, 'user');
        chatInput.value = '';
        
        chatSendBtn.disabled = true;
        chatSendBtn.innerText = '...';

        try {
            const res = await fetch(`${API_BASE}/chatbot/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            if(res.ok) {
                addMessage(data.response, 'bot');
            } else {
                addMessage("Sorry, something went wrong. Please try again later.", 'bot');
            }
        } catch(e) {
            addMessage("Network error. Could not reach support.", 'bot');
        } finally {
            chatSendBtn.disabled = false;
            chatSendBtn.innerText = 'Send';
        }
    };

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') sendMessage();
    });
});

