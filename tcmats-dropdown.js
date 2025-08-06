// Data for TCMATS dropdowns
let tcmatsData = {};

// Load data from combo.csv for TCMATS survey
async function loadTcmatsDataFromCSV() {
    try {
        const response = await fetch('combo.csv');
        let csvText = await response.text();
        if (csvText.charCodeAt(0) === 65279) {
            csvText = csvText.slice(1);
        }
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const newData = {};

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 2) {
                const lga = parts[0].trim();
                const school = parts[1].trim();

                if (lga && school) {
                    if (!newData[lga]) {
                        newData[lga] = [];
                    }
                    newData[lga].push(school);
                }
            }
        }

        tcmatsData = newData;
        console.log('Successfully loaded and parsed tcmats data from combo.csv.');
    } catch (error) {
        console.error('Error loading or parsing tcmats data from combo.csv:', error);
    }
}

// Load LGEAs into the TCMATS LGEA dropdown
function loadLgeasForTcmats() {
    const lgeaDropdown = document.getElementById('tcmats_lgea');
    if (!lgeaDropdown) return;

    const lgas = Object.keys(tcmatsData).sort();
    lgeaDropdown.innerHTML = '<option value="">Select LGEA</option>';
    lgas.forEach(lga => {
        const option = document.createElement('option');
        option.value = lga;
        option.textContent = lga;
        lgeaDropdown.appendChild(option);
    });

    // Reset school dropdown
    const schoolDropdown = document.getElementById('tcmats_schoolName');
    if (schoolDropdown) {
        schoolDropdown.innerHTML = '<option value="">Select LGEA first</option>';
        schoolDropdown.disabled = true;
    }
}

// Load schools into the TCMATS school dropdown based on selected LGEA
function loadSchoolsForTcmats() {
    const lgeaDropdown = document.getElementById('tcmats_lgea');
    const schoolDropdown = document.getElementById('tcmats_schoolName');
    if (!lgeaDropdown || !schoolDropdown) return;

    const selectedLga = lgeaDropdown.value;
    schoolDropdown.innerHTML = '<option value="">Select School</option>';
    if (!selectedLga) {
        schoolDropdown.disabled = true;
        schoolDropdown.innerHTML = '<option value="">Select LGEA first</option>';
        return;
    }

    schoolDropdown.disabled = false;
    const schools = tcmatsData[selectedLga] || [];
    schools.forEach(school => {
        const option = document.createElement('option');
        option.value = school;
        option.textContent = school;
        schoolDropdown.appendChild(option);
    });
}

// Data is loaded by the showSurvey function in index.html
