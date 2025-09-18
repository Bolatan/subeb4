let allSurveys = []; // Global variable to hold survey data for exports

function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.silat_1_4_schoolName || 'N/A';
    const respondentName = formData.silat_1_4_es_name || 'N/A'; // LGEA-level survey
    const lga = formData.silat_1_4_localGov || 'N/A';
    return { schoolName, respondentName, lga };
}

document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayReports('silat_1.4');
});

function fetchAndDisplayReports(surveyType, page = 1) {
    const tableBody = document.querySelector('#reportsTable tbody');
    const loadingMessage = document.getElementById('loadingMessage');
    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));

    if (!user || !user.token) {
        loadingMessage.innerHTML = '<strong>Authentication required.</strong><br>Please log in to view this content.';
        return;
    }

    loadingMessage.style.display = 'block';
    tableBody.innerHTML = '';

    fetch(`/api/reports/${surveyType}?page=${page}`, {
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
    .then(data => {
        const surveys = data.responses;
        allSurveys = surveys; // Store data for export functions
        loadingMessage.style.display = 'none';
        if (surveys.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">No ${surveyType.replace(/_/g, ' ').toUpperCase()} reports found.</td></tr>`;
            return;
        }

        surveys.forEach(survey => {
            const row = tableBody.insertRow();
            const { schoolName, respondentName, lga } = getSurveyDisplayData(survey);
            const username = survey.user ? survey.user.username : 'N/A';
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
                <td>${username}</td>
                <td>${schoolName} (${lga})</td>
                <td>${respondentName}</td>
                <td>${new Date(survey.createdAt).toLocaleString()}</td>
                <td>${imagesHtml}</td>
                <td>
                    <button class="btn" onclick='viewDetails(${JSON.stringify(survey)})'>View Details</button>
                    <button class="btn btn-danger" onclick="deleteReport('${survey._id}')" style="margin-left: 5px;">Delete</button>
                </td>
            `;
        });

        renderPagination(data.pagination, surveyType);
    })
    .catch(error => {
        if (error.message !== 'Access Denied') {
            loadingMessage.innerHTML = '<strong>Failed to load reports.</strong><br>Please ensure the backend server is running and accessible.';
        }
        console.error(`Error fetching ${surveyType} reports:`, error);
    });
}

function renderPagination(pagination, surveyType) {
    const { currentPage, totalPages } = pagination;
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevButton = document.createElement('button');
    prevButton.innerHTML = '&laquo; Previous';
    prevButton.className = 'btn';
    prevButton.disabled = currentPage === 1;
    prevButton.onclick = () => fetchAndDisplayReports(surveyType, currentPage - 1);
    paginationContainer.appendChild(prevButton);

    const pageInfo = document.createElement('span');
    pageInfo.textContent = ` Page ${currentPage} of ${totalPages} `;
    pageInfo.style.margin = '0 10px';
    paginationContainer.appendChild(pageInfo);

    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Next &raquo;';
    nextButton.className = 'btn';
    nextButton.disabled = currentPage === totalPages;
    nextButton.onclick = () => fetchAndDisplayReports(surveyType, currentPage + 1);
    paginationContainer.appendChild(nextButton);
}


function deleteReport(id) {
    if (!confirm('Are you sure you want to delete this report?')) {
        return;
    }

    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));
    if (!user || !user.token) {
        alert('Authentication required.');
        return;
    }

    fetch(`/api/reports/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${user.token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete report.');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        location.reload();
    })
    .catch(error => {
        alert(error.message);
        console.error('Error deleting report:', error);
    });
}

function deleteAllReports(surveyType) {
    if (!confirm(`Are you sure you want to delete all ${surveyType.toUpperCase()} reports? This action cannot be undone.`)) {
        return;
    }

    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));
    if (!user || !user.token) {
        alert('Authentication required.');
        return;
    }

    fetch(`/api/reports/all/${surveyType}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${user.token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete all reports.');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        location.reload();
    })
    .catch(error => {
        alert(error.message);
        console.error(`Error deleting all ${surveyType} reports:`, error);
    });
}

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

async function exportToPDF() {
    const surveys = await fetchAllSurveyData('silat_1.4');
    if (!surveys || surveys.length === 0) {
        alert("No data to export.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("SILAT_1.4 Survey Reports", 14, 16);

    const tableBody = surveys.map(survey => {
        const { schoolName, respondentName, lga } = getSurveyDisplayData(survey);
        const username = survey.user ? survey.user.username : 'N/A';
        return [username, `${schoolName} (${lga})`, respondentName, new Date(survey.createdAt).toLocaleString()];
    });

    doc.autoTable({
        head: [['Username', 'School (LGA)', 'Respondent', 'Submission Date']],
        body: tableBody,
    });

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

async function exportToExcel() {
    const surveys = await fetchAllSurveyData('silat_1.4');
    if (!surveys || surveys.length === 0) {
        alert("No data to export.");
        return;
    }

    const surveyType = 'silat_1.4';
    const labels = surveyLabelMaps[surveyType] || {};

    const worksheetData = surveys.map(survey => {
        const flattenedFormData = flattenObject(survey.formData);
        const username = survey.user ? survey.user.username : 'N/A';
        const rowData = {
            'Username': username,
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Survey Reports");

    XLSX.writeFile(workbook, "silat_1.4-survey-reports.xlsx");
}
