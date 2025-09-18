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
        return data.responses;
    } catch (error) {
        console.error(`Error fetching all ${surveyType} survey data for export:`, error);
        alert('Failed to fetch data for export. Please try again.');
        return null;
    }
}
