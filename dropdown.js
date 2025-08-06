// --- Function to fetch and parse CSV to build lagosStateData ---
async function loadLagosStateDataFromCSV() {
    try {
        const response = await fetch('SCHOOL_LIST_AS_AT_JANUARY_2025 1,026.csv');
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const newLagosStateData = {};

        // Skip header row, assuming the first row is the header
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 2) {
                const lga = parts[0].trim();
                const school = parts[1].trim();

                if (lga && school) {
                    if (!newLagosStateData[lga]) {
                        newLagosStateData[lga] = [];
                    }
                    newLagosStateData[lga].push(school);
                }
            }
        }

        lagosStateData = newLagosStateData;
        console.log('Successfully loaded and parsed school data from CSV.');
    } catch (error) {
        console.error('Error loading or parsing school data from CSV:', error);
        // Fallback to existing data if CSV loading fails
    }
}
 // Load Local Government Areas into dropdown
 function loadLocalGovernments() {
    const localGovDropdown = document.getElementById('localGov');
    const lgas = Object.keys(lagosStateData).sort();
    localGovDropdown.innerHTML = '<option value="">Select Local Government</option>';
    lgas.forEach(lga => {
        const option = document.createElement('option');
        option.value = lga;
        option.textContent = lga;
        localGovDropdown.appendChild(option);
    });
    // Reset school dropdown
    const schoolDropdown = document.getElementById('schoolName');
    schoolDropdown.innerHTML = '<option value="">Select LGA first</option>';
    schoolDropdown.disabled = true;
}

function loadSchools() {
    const localGov = document.getElementById('localGov').value;
    const schoolDropdown = document.getElementById('schoolName');
    schoolDropdown.innerHTML = '<option value="">Select Primary School</option>';
    if (!localGov) {
        schoolDropdown.disabled = true;
        schoolDropdown.innerHTML = '<option value="">Select LGA first</option>';
        return;
    }
    schoolDropdown.disabled = false;
    const schools = lagosStateData[localGov] || [];
    schools.forEach(school => {
        const option = document.createElement('option');
        option.value = school;
        option.textContent = school;
        schoolDropdown.appendChild(option);
    });
}

let loriData = {};

async function loadLoriData() {
    try {
        const response = await fetch('combo.csv');
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const newLoriData = {};

        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 2) {
                const lga = parts[0].trim();
                const school = parts[1].trim();

                if (lga && school) {
                    if (!newLoriData[lga]) {
                        newLoriData[lga] = [];
                    }
                    newLoriData[lga].push(school);
                }
            }
        }

        loriData = newLoriData;
        populateLoriLgaDropdown();
    } catch (error) {
        console.error('Error loading or parsing LORI data from CSV:', error);
    }
}

function populateLoriLgaDropdown() {
    const lgaDropdown = document.getElementById('lori_lgea');
    if (!lgaDropdown) return;
    const lgas = Object.keys(loriData).sort();
    lgaDropdown.innerHTML = '<option value="">Select Local Government</option>';
    lgas.forEach(lga => {
        const option = document.createElement('option');
        option.value = lga;
        option.textContent = lga;
        lgaDropdown.appendChild(option);
    });

    const schoolDropdown = document.getElementById('lori_school_name');
    schoolDropdown.innerHTML = '<option value="">Select LGEA first</option>';
    schoolDropdown.disabled = true;
}

function populateLoriSchoolDropdown() {
    const lga = document.getElementById('lori_lgea').value;
    const schoolDropdown = document.getElementById('lori_school_name');
    schoolDropdown.innerHTML = '<option value="">Select School</option>';
    if (!lga) {
        schoolDropdown.disabled = true;
        schoolDropdown.innerHTML = '<option value="">Select LGEA first</option>';
        return;
    }
    schoolDropdown.disabled = false;
    const schools = loriData[lga] || [];
    schools.forEach(school => {
        const option = document.createElement('option');
        option.value = school;
        option.textContent = school;
        schoolDropdown.appendChild(option);
    });
}
