// --- Inactivity Logout Logic ---
let inactivityTimer;

function showInactivityModal() {
    const modal = document.getElementById('inactivityModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeInactivityModal() {
    const modal = document.getElementById('inactivityModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.location.href = '/'; // Redirect to login page
}

function handleInactivityLogout() {
    performClientSideLogout(); // Log out immediately for security
    showInactivityModal();     // Then show the modal
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(handleInactivityLogout, 10800000); // 3 hours
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

// It's assumed that performClientSideLogout is defined in the main script of each page.
// If not, it should be included here or in another shared script.
// For example:
/*
function performClientSideLogout() {
    // This function might need access to `currentUser` or other page-specific variables.
    // If it's generic enough, it can be fully defined here.
    // For now, we assume it exists on the pages that include this script.
    console.log("Performing client-side logout due to inactivity.");
    localStorage.removeItem('auditAppCurrentUser');
    // Any other cleanup...
}
*/

// Automatically start listening for inactivity when this script is loaded
// and a user session exists.
if (localStorage.getItem('auditAppCurrentUser')) {
    setupInactivityListeners();
}
