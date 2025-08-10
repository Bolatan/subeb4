// --- Globals for survey data ---
let lagosStateData = {};
let specialSchoolsData = {};
let vocationalCentersData = {};
let comboData = {}; // For TCMATS, LORI, VOICES which share combo.csv

// --- Generic CSV Data Loader ---
/**
 * Fetches and parses a CSV file into an object mapping the first column to an array of the second column.
 * Assumes a simple CSV format with at least two columns and a header row.
 * @param {string} url - The URL of the CSV file to load.
 * @returns {Promise<Object>} A promise that resolves to the parsed data object.
 */
async function loadCsvData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const csvText = await response.text();
        const data = {};
        // Handle potential BOM character at the start of the file
        const cleanedCsvText = csvText.trim().startsWith('ï»¿') ? csvText.trim().substring(3) : csvText.trim();
        const lines = cleanedCsvText.split('\n').filter(line => line.trim() !== '');

        // Start from 1 to skip header row
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            if (parts.length >= 2) {
                const key = parts[0].trim(); // e.g., LGA
                const value = parts[1].trim(); // e.g., School Name

                if (key && value) {
                    if (!data[key]) {
                        data[key] = [];
                    }
                    if (!data[key].includes(value)) {
                        data[key].push(value);
                    }
                }
            }
        }
        console.log(`Successfully loaded and parsed data from ${url}.`);
        return data;
    } catch (error) {
        console.error(`Error loading or parsing data from ${url}:`, error);
        return {}; // Return empty object on failure
    }
}

// --- Specific Data Loaders ---
async function loadAllData() {
    // Using Promise.all to load all data in parallel for efficiency
    [
        lagosStateData,
        specialSchoolsData,
        vocationalCentersData,
        comboData,
    ] = await Promise.all([
        loadCsvData('SCHOOL_LIST_AS_AT_JANUARY_2025 1,026.csv'),
        loadCsvData('SPECIAL SCHOOLS AND INCLUSIVE UNITS1.csv'),
        loadCsvData('LIST OF VOCATIONAL CENTRES.csv'),
        loadCsvData('combo.csv')
    ]);
}


// --- Generic Dropdown Population Functions ---

/**
 * Populates a dropdown with options.
 * @param {HTMLElement} dropdown - The select element to populate.
 * @param {string[]} options - An array of strings to use as options.
 * @param {string} placeholder - The placeholder text for the first option.
 */
function populateDropdown(dropdown, options, placeholder) {
    if (!dropdown) return;
    dropdown.innerHTML = `<option value="">${placeholder}</option>`;
    options.sort().forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        dropdown.appendChild(option);
    });
}

/**
 * Sets up two linked dropdowns, where the second depends on the first.
 * @param {string} lgaDropdownId - The ID of the LGEA/primary dropdown.
 * @param {string} schoolDropdownId - The ID of the School/secondary dropdown.
 * @param {Object} data - The data object (e.g., lagosStateData) to use for populating.
 */
function setupLinkedDropdowns(lgaDropdownId, schoolDropdownId, data) {
    const lgaDropdown = document.getElementById(lgaDropdownId);
    const schoolDropdown = document.getElementById(schoolDropdownId);

    if (!lgaDropdown || !schoolDropdown) {
        console.error(`Dropdowns not found: ${lgaDropdownId}, ${schoolDropdownId}`);
        return;
    }

    const lgas = Object.keys(data);
    populateDropdown(lgaDropdown, lgas, 'Select Local Government');

    schoolDropdown.innerHTML = '<option value="">Select LGEA first</option>';
    schoolDropdown.disabled = true;

    lgaDropdown.addEventListener('change', () => {
        const selectedLga = lgaDropdown.value;
        if (selectedLga && data[selectedLga]) {
            populateDropdown(schoolDropdown, data[selectedLga], 'Select School/Institution');
            schoolDropdown.disabled = false;
        } else {
            schoolDropdown.innerHTML = '<option value="">Select LGEA first</option>';
            schoolDropdown.disabled = true;
        }
    });
}

// --- Old function names kept for compatibility during refactor, can be removed later ---
function loadLocalGovernments() {
    setupLinkedDropdowns('localGov', 'schoolName', lagosStateData);
}

function loadSchools() {
    // This function is now handled by the event listener in setupLinkedDropdowns.
    // It's kept here in case it's called directly somewhere, but it does nothing.
}

function populateLoriLgaDropdown() {
     setupLinkedDropdowns('lori_lgea', 'lori_school_name', comboData);
}

function populateLoriSchoolDropdown() {
    // Handled by event listener.
}

// New functions to be called from index.html
function initializeSilnatDropdowns() {
    setupLinkedDropdowns('localGov', 'schoolName', lagosStateData);
}

function initializeTcmatsDropdowns() {
    setupLinkedDropdowns('tcmats_lgea', 'tcmats_schoolName', comboData);
}

function initializeVoicesDropdowns() {
    setupLinkedDropdowns('voices_lgea', 'voices_schoolName', comboData);
}

function initializeLoriDropdowns() {
    setupLinkedDropdowns('lori_lgea', 'lori_school_name', comboData);
}

function initializeSilat12Dropdowns() {
    setupLinkedDropdowns('silat_1_2_localGov', 'silat_1_2_schoolName', specialSchoolsData);
}

function initializeSilat13Dropdowns() {
    setupLinkedDropdowns('silat13_lgea', 'silat13_school_name', vocationalCentersData);
}

function initializeSilat14Dropdowns() {
    // This form only has one dropdown, for LGEA.
    const lgaDropdown = document.getElementById('silat_1_4_localGov');
    if (lgaDropdown) {
        // The data for this dropdown is not clearly defined in the old code.
        // It seems to be all LGAs. `lagosStateData` seems like a reasonable source.
        const lgas = Object.keys(lagosStateData);
        populateDropdown(lgaDropdown, lgas, 'Select Local Government');
    }
}
