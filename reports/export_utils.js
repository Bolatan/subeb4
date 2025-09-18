// Helper function to fetch all survey data for exports
async function fetchAllSurveyData(surveyType) {
    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));
    if (!user || !user.token) {
        alert('Authentication required. Please log in.');
        return null;
    }

    try {
        const response = await fetch(`/api/reports/${surveyType}/all`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data; // Assuming the endpoint returns the array of surveys directly
    } catch (error) {
        console.error(`Error fetching all ${surveyType} survey data for export:`, error);
        alert('Failed to fetch data for export. Please try again.');
        return null;
    }
}

function flattenObject(obj, prefix = '') {
    return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
}
