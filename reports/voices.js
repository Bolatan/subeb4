let allSurveys = []; // Global variable to hold survey data for exports

function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.voices_schoolName || 'N/A';
    const respondentName = formData.voices_gender || 'N/A'; // Using gender as a placeholder for respondent
    const lga = formData.voices_lgea || 'N/A';
    return { schoolName, respondentName, lga };
}

document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.querySelector('#reportsTable tbody');
    const loadingMessage = document.getElementById('loadingMessage');
    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));

    if (!user || !user.token) {
        loadingMessage.innerHTML = '<strong>Authentication required.</strong><br>Please log in to view this content.';
        return;
    }

    fetch('/api/reports/voices', {
        headers: {
            'Authorization': `Bearer ${user.token}`
        }
    })
    .then(response => {
        if (response.status === 401) {
            loadingMessage.innerHTML = '<strong>Access Denied.</strong><br>You do not have permission to view this page.';
            throw new Error('Access Denied');
        }
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(surveys => {
        allSurveys = surveys; // Store data for export functions
        loadingMessage.style.display = 'none';
        if (surveys.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No VOICES reports found.</td></tr>';
            return;
        }

        tableBody.innerHTML = ''; // Clear previous content

        surveys.forEach(survey => {
            const row = tableBody.insertRow();
            const { schoolName, respondentName, lga } = getSurveyDisplayData(survey);

            row.innerHTML = `
                <td>${schoolName} (${lga})</td>
                <td>${respondentName}</td>
                <td>${new Date(survey.createdAt).toLocaleString()}</td>
                <td><button class="btn" onclick='viewDetails(${JSON.stringify(survey)})'>View Details</button></td>
            `;
        });
    })
    .catch(error => {
        if (error.message !== 'Access Denied') {
            loadingMessage.innerHTML = '<strong>Failed to load reports.</strong><br>Please ensure the backend server is running and accessible.';
        }
        console.error('Error fetching VOICES reports:', error);
    });
});

const modal = document.getElementById('detailsModal');
const modalData = document.getElementById('modal-data');

function viewDetails(survey) {
    modalData.textContent = JSON.stringify(survey, null, 2);
    modal.style.display = "block";
}

function closeModal() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

function exportToPDF() {
    if (allSurveys.length === 0) {
        alert("No data to export.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("VOICES Survey Reports", 14, 16);

    const table = document.getElementById('reportsTable');
    const tableClone = table.cloneNode(true);
    Array.from(tableClone.rows).forEach(row => row.deleteCell(-1)); // Remove "Actions" column

    doc.autoTable({ html: tableClone });

    doc.save('voices-survey-reports.pdf');
}

function exportToExcel() {
    if (allSurveys.length === 0) {
        alert("No data to export.");
        return;
    }

    const worksheetData = allSurveys.map(survey => {
        const { createdAt, formData } = survey;
        const row = {
            'Submission Date': new Date(createdAt).toLocaleString(),
            'Institution': formData.voices_institution,
            'LGEA': formData.voices_lgea,
            'School Name': formData.voices_schoolName,
            'Location': formData.tcmats_location,
            'Class': formData.voices_class,
            'Class Description': formData.voices_class_description,
            'Gender': formData.voices_gender,
            'Distance from Home': formData.voices_distance,
            'Difficult Topics': formData.voices_difficult_topics,
            'Major Requests': formData.major_requests,
            'School Building': formData.school_building,
            'Furniture': formData.furniture,
            'Classroom Condition': formData.classroom_condition,
            'Perimeter Fence': formData.perimeter_fence,
            'Toilet Type': formData.toilet_type,
            'Toilet Cubicles Available': formData.toilet_cubicles_available,
            'Toilet Cubicles Needing Minor Repair': formData.toilet_cubicles_minor_repair,
            'Toilet Cubicles Needing Major Repair': formData.toilet_cubicles_major_repair,
            'Additional Cubicles Required': formData.toilet_cubicles_additional,
            'Septic Tank': formData.septic_tank,
            'Water Source': formData.water_source,
            'Electricity Source': Array.isArray(formData.electricity_source) ? formData.electricity_source.join(', ') : formData.electricity_source,
            'Waterlogged Area': formData.waterlogged,
            'Clubs': Array.isArray(formData.clubs) ? formData.clubs.join(', ') : formData.clubs,
            'Club Meeting Frequency': formData.clubs_frequency,
            'Sports Equipment': formData.sports_equipment,
        };

        for (let i = 1; i <= 15; i++) {
            row[`Participation Question ${i}`] = formData[`participation_${i}`];
        }

        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VOICES Reports");

    XLSX.writeFile(workbook, "voices-survey-reports.xlsx");
}
