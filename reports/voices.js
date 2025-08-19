document.addEventListener('DOMContentLoaded', function() {
    const reportListContainer = document.getElementById('report-list-container');
    const reportDetailContainer = document.getElementById('report-detail-container');
    const reportList = document.getElementById('report-list');
    const reportTitle = document.getElementById('report-title');

    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get('id');
    const token = localStorage.getItem('token'); // Retrieve the token from local storage

    if (!token) {
        console.error('Authentication token not found. Please log in.');
        reportList.innerHTML = '<p class="error">Authentication token not found. Please <a href="/login.html">log in</a>.</p>';
        return;
    }

    // Function to populate an element if it exists
    function populateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || 'N/A';
        }
    }

    // --- Main Logic ---
    if (reportId) {
        // --- Detail View ---
        // An ID is present, so fetch and display the specific report.
        reportListContainer.style.display = 'none';
        reportDetailContainer.style.display = 'block';
        fetchAndDisplayReport(reportId);
    } else {
        // --- List View ---
        // No ID is present, so fetch and display the list of reports.
        reportListContainer.style.display = 'block';
        reportDetailContainer.style.display = 'none';
        fetchAndDisplayReportList();
    }

    // --- Function Definitions ---

    async function fetchAndDisplayReportList() {
        try {
            const response = await fetch('/api/reports/voices', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch reports list: ${response.statusText}`);
            }

            const reports = await response.json();
            reportList.innerHTML = ''; // Clear "Loading..." message

            if (reports.length === 0) {
                reportList.innerHTML = '<p>No "voices" reports found.</p>';
                return;
            }

            reports.forEach(report => {
                const schoolName = report.formData.voices_schoolName || 'Unknown School';
                const date = new Date(report.createdAt).toLocaleString();
                const listItem = document.createElement('a');
                listItem.href = `?id=${report._id}`;
                listItem.className = 'list-group-item';
                listItem.innerHTML = `<strong>${schoolName}</strong><br><small>Submitted on: ${date}</small>`;
                reportList.appendChild(listItem);
            });
        } catch (error) {
            console.error('Error fetching report list:', error);
            reportList.innerHTML = `<p class="error">Error loading reports: ${error.message}</p>`;
        }
    }

    async function fetchAndDisplayReport(id) {
        try {
            const response = await fetch(`/api/report/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch report data: ${response.statusText}`);
            }

            const report = await response.json();
            const data = report.formData;

            // Update title
            reportTitle.textContent = `Report for ${data.voices_schoolName || 'N/A'}`;

            // Basic Information
            populateElement('report-institution', data.voices_institution);
            populateElement('report-lgea', data.voices_lgea);
            populateElement('report-school-name', data.voices_schoolName);
            populateElement('report-location', data.tcmats_location);
            populateElement('report-class', data.voices_class);
            populateElement('report-class-description', data.voices_class_description);
            populateElement('report-gender', data.voices_gender);
            populateElement('report-distance', data.voices_distance);
            populateElement('report-difficult-topics', data.voices_difficult_topics);
            populateElement('report-major-requests', data.major_requests);

            // Infrastructure
            populateElement('report-school-building', data.school_building);
            populateElement('report-furniture', data.furniture);
            populateElement('report-classroom-condition', data.classroom_condition);
            populateElement('report-perimeter-fence', data.perimeter_fence);

            // Toilet Facilities
            populateElement('report-toilet-type', data.toilet_type);
            populateElement('report-toilet-available', data.toilet_cubicles_available);
            populateElement('report-toilet-minor-repair', data.toilet_cubicles_minor_repair);
            populateElement('report-toilet-major-repair', data.toilet_cubicles_major_repair);
            populateElement('report-toilet-additional', data.toilet_cubicles_additional);
            populateElement('report-septic-tank', data.septic_tank);

            // Utilities & Environment
            populateElement('report-water-source', data.water_source);
            populateElement('report-electricity-source', Array.isArray(data.electricity_source) ? data.electricity_source.join(', ') : data.electricity_source);
            populateElement('report-waterlogged', data.waterlogged);

            // School Activities
            populateElement('report-clubs', Array.isArray(data.clubs) ? data.clubs.join(', ') : data.clubs);
            populateElement('report-clubs-frequency', data.clubs_frequency);
            populateElement('report-sports-equipment', data.sports_equipment);

            // Participation Scores
            let participationTotal = 0;
            let participationCount = 0;
            for (let i = 1; i <= 15; i++) {
                const score = parseInt(data[`participation_${i}`], 10);
                populateElement(`report-participation-${i}`, score || 'N/A');
                if (!isNaN(score)) {
                    participationTotal += score;
                    participationCount++;
                }
            }

            if (participationCount > 0) {
                const average = (participationTotal / participationCount).toFixed(2);
                populateElement('report-participation-average', average);
            } else {
                populateElement('report-participation-average', 'N/A');
            }

        } catch (error) {
            console.error('Error fetching or displaying report:', error);
            reportDetailContainer.innerHTML = `<p class="error">Error loading report details: ${error.message}</p>`;
        }
    }
});
