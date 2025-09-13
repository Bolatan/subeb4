// --- Inactivity Logout Logic ---
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    // Directly call the global logout function with a message
    inactivityTimer = setTimeout(() => logout('You have been logged out due to 5 hours of inactivity.'), 18000000); // 5 hours
}

function setupInactivityListeners() {
    // Reset timer on user activity
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);

    // Start the timer for the first time
    resetInactivityTimer();
}

function clearInactivityListeners() {
    clearTimeout(inactivityTimer);
    window.removeEventListener('mousemove', resetInactivityTimer);
    window.removeEventListener('mousedown', resetInactivityTimer);
    window.removeEventListener('keypress', resetInactivityTimer);
    window.removeEventListener('scroll', resetInactivityTimer);
    window.removeEventListener('touchstart', resetInactivityTimer);
}

// It's assumed that a global `logout(message)` function is defined on pages that include this script.

// Automatically start listening for inactivity when this script is loaded
// and a user session exists.
if (localStorage.getItem('auditAppCurrentUser')) {
    setupInactivityListeners();
}
