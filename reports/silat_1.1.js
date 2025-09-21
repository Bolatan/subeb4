let allSurveys = []; // Global variable to hold survey data for exports

function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.schoolName;
    const lga = formData.localGov;
    const respondentName = formData.silnat_a_ht_name || 'N/A';

    let schoolDisplay;
    if (schoolName && lga) {
        schoolDisplay = `${schoolName} (${lga})`;
    } else if (schoolName) {
        schoolDisplay = schoolName;
    } else if (lga) {
        schoolDisplay = lga;
    } else {
        schoolDisplay = 'N/A';
    }
    return { schoolDisplay, respondentName };
}

document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayReports('silat_1.1');
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
            const { schoolDisplay, respondentName } = getSurveyDisplayData(survey);
            const username = survey.user ? survey.user.username : 'N/A';
            const photos = survey.formData.photos || [];
            let imagesHtml = '';
            if (photos.length > 0) {
                imagesHtml = photos.map(photo => `
                    <a href="${photo}" target="_blank">
                        <img loading="lazy" src="${photo}" alt="Survey Photo" style="width: 50px; height: 50px; object-fit: cover; margin: 2px;">
                    </a>
                `).join('');
            }

            row.innerHTML = `
                <td>${username}</td>
                <td>${schoolDisplay}</td>
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
            const value = formData[key];

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

function exportToCSV() {
    console.log("Initiating CSV export for silat_1.1");
    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));
    if (!user || !user.token) {
        alert('Authentication required. Please log in.');
        return;
    }

    // The new streaming endpoint handles data fetching, so we just need to point the browser to it.
    // The auth token is passed as a query parameter for the 'protect' middleware.
    const exportUrl = `/api/export/silat_1.1/csv?token=${user.token}`;

    // This will trigger a file download in the browser.
    window.location.href = exportUrl;
}

function exportToPDF() {
    console.log("Initiating PDF export for silat_1.1");
    exportTableToPDF('reportsTable', 'silat_1.1_reports.pdf');
}
