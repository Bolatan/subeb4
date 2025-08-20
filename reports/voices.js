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
            const photos = survey.formData.photos || [];
            let imagesHtml = '';
            if (photos.length > 0) {
                imagesHtml = photos.map(photo => `
                    <a href="${photo}" target="_blank">
                        <img src="${photo}" alt="Survey Photo" style="width: 50px; height: 50px; object-fit: cover; margin: 2px;">
                    </a>
                `).join('');
            }

            row.innerHTML = `
                <td>${schoolName} (${lga})</td>
                <td>${respondentName}</td>
                <td>${new Date(survey.createdAt).toLocaleString()}</td>
                <td>${imagesHtml}</td>
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
    const surveyType = survey.surveyType;
    const labels = surveyLabelMaps[surveyType] || {};
    const formData = survey.formData || {};

    let detailsHtml = '<div class="details-grid">';

    for (const key in formData) {
        if (Object.prototype.hasOwnProperty.call(formData, key)) {
            const label = labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let value = formData[key];

            if (Array.isArray(value)) {
                value = value.join(', ');
            }

            if (value !== '' && value !== null) {
                detailsHtml += `<div class="detail-item"><strong class="detail-label">${label}:</strong> <span class="detail-value">${value}</span></div>`;
            }
        }
    }

    detailsHtml += '</div>';

    modalData.innerHTML = detailsHtml;
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

    const surveyType = 'voices';
    const labels = surveyLabelMaps[surveyType] || {};

    const worksheetData = allSurveys.map(survey => {
        const flattenedFormData = flattenObject(survey.formData);
        const rowData = {
            'Survey Type': survey.surveyType,
            'Submission Date': new Date(survey.createdAt).toLocaleString()
        };

        for (const key in flattenedFormData) {
            if (Object.prototype.hasOwnProperty.call(flattenedFormData, key)) {
                if (key === 'photos' && Array.isArray(flattenedFormData[key])) {
                    flattenedFormData[key].forEach((photo, index) => {
                        rowData[`Photo ${index + 1}`] = { v: `View Photo ${index + 1}`, l: { Target: photo } };
                    });
                } else {
                    const label = labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    let value = flattenedFormData[key];
                    if (Array.isArray(value)) {
                        value = value.join(', ');
                    }
                    rowData[label] = value;
                }
            }
        }
        return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VOICES Reports");

    XLSX.writeFile(workbook, "voices-survey-reports.xlsx");
}
