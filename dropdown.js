// --- Globals for survey data ---
let lagosStateData = {};
let specialSchoolsData = {};
let vocationalCentersData = {};
let comboData = {}; // For TCMATS, LORI, VOICES which share combo.csv
let lgeaData = {};

// --- Generic CSV Data Loader ---
/**
 * Fetches and parses a CSV file into an object mapping the first column to an array of the second column.
 * Assumes a simple CSV format with at least two columns and a header row.
 * @param {string} url - The URL of the CSV file to load.
 * @returns {Promise<Object>} A promise that resolves to the parsed data object.
 */
async function loadCsvData(url) {
    const cacheKey = `csv_cache_${url}`;
    try {
        // First, try to load from localStorage
        const cachedCsvText = localStorage.getItem(cacheKey);
        if (cachedCsvText) {
            console.log(`Loading data from cache for ${url}.`);
            // If we have cached data, parse and return it.
            return parseCsvText(cachedCsvText);
        }

        // If not in cache, fetch from network
        console.log(`Fetching data from network for ${url}.`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const csvText = await response.text();

        // Store in cache for future use
        localStorage.setItem(cacheKey, csvText);
        console.log(`Data from ${url} cached.`);

        // Parse and return the data
        return parseCsvText(csvText);

    } catch (error) {
        console.error(`Error loading or parsing data from ${url}:`, error);
        // If there's an error (e.g., offline and not in cache), return empty object
        return {};
    }
}

function parseCsvText(csvText) {
    const data = {};
    const cleanedCsvText = csvText.trim().startsWith('ï»¿') ? csvText.trim().substring(3) : csvText.trim();
    const lines = cleanedCsvText.split('\n').filter(line => line.trim() !== '');

    // Regex to properly handle commas inside quotes
    const regex = /("([^"]*)"|([^,]*)),(.*)/;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const match = line.match(regex);

        if (match) {
            // Determine the key (LGEA). It's either the unquoted group or the quoted group.
            const key = (match[3] || match[2] || '').trim();
            // The rest of the line is the value (School Name)
            let value = (match[4] || '').trim();

            // Remove quotes if they exist at the start and end of the value
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
            }

            if (key && value) {
                if (!data[key]) {
                    data[key] = [];
                }
                // Avoid adding duplicates
                if (!data[key].includes(value)) {
                    data[key].push(value);
                }
            }
        } else {
            // Handle lines that might not match the regex, e.g., lines with no comma
            const key = line.trim();
            if (key) {
                if (!data[key]) {
                    data[key] = [];
                }
            }
        }
    }
    return data;
}

// --- Specific Data Loaders ---
async function loadAllData() {
    console.log("Starting to load all CSV data...");
    try {
        // Using Promise.all to load all data in parallel for efficiency
        [
            lagosStateData,
            specialSchoolsData,
            vocationalCentersData,
            comboData,
        ] = await Promise.all([
            loadCsvData('SCHOOL_LIST_AS_AT_JANUARY_2025_updated.csv'),
            loadCsvData('SPECIAL SCHOOLS AND INCLUSIVE UNITS1.csv'),
            loadCsvData('LIST OF VOCATIONAL CENTRES.csv'),
            loadCsvData('combo.csv')
        ]);

        console.log("comboData loaded:", comboData); // DEBUG

        // Create lgeaData from lagosStateData
        const lgas = Object.keys(lagosStateData);
        lgas.forEach(lga => {
            lgeaData[lga] = [lga];
        });
        console.log("Finished loading all CSV data.");
    } catch (error) {
        console.error("An error occurred during loadAllData:", error);
    }
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
    console.log("Initializing VOICES dropdowns with comboData:", comboData); // DEBUG
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
    setupLinkedDropdowns('silat_1_4_localGov', 'silat_1_4_schoolName', lagosStateData);
}
