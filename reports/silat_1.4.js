let allSurveys = []; // Global variable to hold survey data for exports

function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.silat_1_4_schoolName || 'N/A';
    const respondentName = 'N/A'; // LGEA-level survey
    const lga = formData.silat_1_4_localGov || 'N/A';
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

    fetch('/api/reports/silat_1.4', {
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
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No SILAT_1.4 reports found.</td></tr>';
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
        console.error('Error fetching SILAT_1.4 reports:', error);
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

    doc.text("SILAT_1.4 Survey Reports", 14, 16);

    const table = document.getElementById('reportsTable');
    const tableClone = table.cloneNode(true);
    Array.from(tableClone.rows).forEach(row => row.deleteCell(-1)); // Remove "Actions" column

    doc.autoTable({ html: tableClone });

    doc.save('silat_1.4-survey-reports.pdf');
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

function exportToExcel() {
    if (allSurveys.length === 0) {
        alert("No data to export.");
        return;
    }

    const worksheetData = allSurveys.map(survey => {
        const flattenedFormData = flattenObject(survey.formData);
        const rowData = {
            'Survey Type': survey.surveyType,
            'Submission Date': new Date(survey.createdAt).toLocaleString(),
            ...flattenedFormData
        };
        return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Survey Reports");

    XLSX.writeFile(workbook, "silat_1.4-survey-reports.xlsx");
}
