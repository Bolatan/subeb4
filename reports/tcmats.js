document.addEventListener('DOMContentLoaded', function() {
    const summaryContainer = document.getElementById('summaryContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));

    if (!user || !user.token) {
        loadingMessage.innerHTML = '<strong>Authentication required.</strong><br>Please log in to view this content.';
        return;
    }

    fetch('/api/reports/tcmats/summary', {
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
    .then(summary => {
        loadingMessage.style.display = 'none';
        if (summary.totalSubmissions === 0) {
            summaryContainer.innerHTML = '<p>No TCMATS reports found.</p>';
            return;
        }

        renderSummary(summary);
    })
    .catch(error => {
        if (error.message !== 'Access Denied') {
            loadingMessage.innerHTML = '<strong>Failed to load summary.</strong><br>Please ensure the backend server is running and accessible.';
        }
        console.error('Error fetching TCMATS summary:', error);
    });
});

function renderSummary(summary) {
    const summaryContainer = document.getElementById('summaryContainer');

    let html = `
        <div class="summary-cards">
            <div class="card">
                <h3>Total Submissions</h3>
                <p>${summary.totalSubmissions}</p>
            </div>
            <div class="card">
                <h3>Avg. Periods Per Week</h3>
                <p>${summary.avgPeriodsPerWeek}</p>
            </div>
            <div class="card">
                <h3>Avg. Pupils In Class</h3>
                <p>${summary.avgPupilsInClass}</p>
            </div>
        </div>
    `;

    html += '<h3>Breakdowns</h3>';

    html += createTable('Location Distribution', summary.locationCounts);
    html += createTable('Institution Types', summary.institutionCounts);
    html += createTable('Highest Qualifications', summary.qualificationCounts);
    html += createTable('Gender Distribution', summary.genderCounts);
    html += createTable('Teaching Experience', summary.teachingExperienceCounts);
    html += createTable('Class Descriptions', summary.classDescriptionCounts);
    html += createTable('Lesson Preparation (Item 1)', summary.lessonPrep1Counts);
    html += createTable('Subject Mastery (Item 2)', summary.subjectMastery2Counts);

    summaryContainer.innerHTML = html;
}

function createTable(title, data) {
    if (!data || Object.keys(data).length === 0) {
        return '';
    }

    let tableHtml = `
        <div class="summary-table">
            <h4>${title}</h4>
            <table>
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (const [key, value] of Object.entries(data)) {
        tableHtml += `
            <tr>
                <td>${key}</td>
                <td>${value}</td>
            </tr>
        `;
    }

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    return tableHtml;
}
