// School Assessment Report Populator
document.addEventListener('DOMContentLoaded', function() {
    console.log('Report populator loaded');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL Parameters found:', urlParams.toString());

    // Function to safely decode and clean parameter values
    function cleanParam(value) {
        if (!value) return '';
        return decodeURIComponent(value.replace(/\+/g, ' ')).trim();
    }

    // Function to get multiple values for same parameter
    function getMultipleValues(paramName) {
        const values = urlParams.getAll(paramName);
        return values.map(cleanParam).filter(v => v).join(', ');
    }

    // Function to populate an element if it exists
    function populateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element && value) {
            element.textContent = value;
            console.log(`Populated ${elementId}:`, value);
        } else if (!element) {
            console.warn(`Element with id '${elementId}' not found`);
        }
    }

    // Function to populate elements by class name
    function populateByClass(className, value) {
        const elements = document.getElementsByClassName(className);
        for (let element of elements) {
            if (value) {
                element.textContent = value;
                console.log(`Populated class '${className}':`, value);
            }
        }
    }

    try {
        // Basic Information
        populateElement('report-institution', cleanParam(urlParams.get('voices_institution')));
        populateElement('report-lgea', cleanParam(urlParams.get('voices_lgea')));
        populateElement('report-school-name', cleanParam(urlParams.get('voices_schoolName')));
        populateElement('report-location', cleanParam(urlParams.get('tcmats_location')));
        populateElement('report-class', cleanParam(urlParams.get('voices_class')));
        populateElement('report-class-description', cleanParam(urlParams.get('voices_class_description')));
        populateElement('report-gender', cleanParam(urlParams.get('voices_gender')));
        populateElement('report-distance', cleanParam(urlParams.get('voices_distance')));
        populateElement('report-difficult-topics', cleanParam(urlParams.get('voices_difficult_topics')));

        // Participation Scores (1-15)
        for (let i = 1; i <= 15; i++) {
            const score = urlParams.get(`participation_${i}`);
            populateElement(`report-participation-${i}`, score);
        }

        // Infrastructure
        populateElement('report-school-building', cleanParam(urlParams.get('school_building')));
        populateElement('report-furniture', cleanParam(urlParams.get('furniture')));
        populateElement('report-classroom-condition', cleanParam(urlParams.get('classroom_condition')));
        populateElement('report-perimeter-fence', cleanParam(urlParams.get('perimeter_fence')));

        // Toilet Facilities
        populateElement('report-toilet-type', cleanParam(urlParams.get('toilet_type')));
        populateElement('report-toilet-available', urlParams.get('toilet_cubicles_available'));
        populateElement('report-toilet-minor-repair', urlParams.get('toilet_cubicles_minor_repair'));
        populateElement('report-toilet-major-repair', urlParams.get('toilet_cubicles_major_repair'));
        populateElement('report-toilet-additional', urlParams.get('toilet_cubicles_additional'));
        populateElement('report-septic-tank', cleanParam(urlParams.get('septic_tank')));

        // Utilities
        populateElement('report-water-source', cleanParam(urlParams.get('water_source')));

        // Handle multiple electricity sources
        const electricitySources = getMultipleValues('electricity_source');
        populateElement('report-electricity-source', electricitySources);

        // Activities
        const clubs = getMultipleValues('clubs');
        populateElement('report-clubs', clubs);
        populateElement('report-clubs-frequency', cleanParam(urlParams.get('clubs_frequency')));
        populateElement('report-sports-equipment', cleanParam(urlParams.get('sports_equipment')));

        // Environmental
        populateElement('report-waterlogged', cleanParam(urlParams.get('waterlogged')));
        populateElement('report-major-requests', cleanParam(urlParams.get('major_requests')));

        // Calculate participation average
        let participationTotal = 0;
        let participationCount = 0;
        for (let i = 1; i <= 15; i++) {
            const score = parseInt(urlParams.get(`participation_${i}`));
            if (!isNaN(score)) {
                participationTotal += score;
                participationCount++;
            }
        }

        if (participationCount > 0) {
            const average = (participationTotal / participationCount).toFixed(2);
            populateElement('report-participation-average', average);
        }

        // Show success message
        console.log('Report population completed successfully');

        // Optional: Show a notification that report was loaded
        const notification = document.createElement('div');
        notification.style.cssText = 'position: fixed; top: 10px; right: 10px; background: green; color: white; padding: 10px; border-radius: 5px; z-index: 1000;';
        notification.textContent = 'Report data loaded successfully!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);

    } catch (error) {
        console.error('Error populating report:', error);

        // Show error notification
        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = 'position: fixed; top: 10px; right: 10px; background: red; color: white; padding: 10px; border-radius: 5px; z-index: 1000;';
        errorNotification.textContent = 'Error loading report data!';
        document.body.appendChild(errorNotification);
        setTimeout(() => errorNotification.remove(), 5000);
    }
});

// Debug function to list all parameters
function debugParameters() {
    const params = new URLSearchParams(window.location.search);
    console.table(Array.from(params.entries()));
}

// Debug function to find all potential report elements
function findReportElements() {
    const elements = document.querySelectorAll('[id*="report"], [class*="report"]');
    console.log('Found report elements:', elements);
    elements.forEach(el => {
        console.log(`ID: ${el.id}, Class: ${el.className}, Tag: ${el.tagName}`);
    });
}

// Call debug functions
debugParameters();
findReportElements();
