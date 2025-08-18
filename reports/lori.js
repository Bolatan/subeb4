let allSurveys = []; // Global variable to hold survey data for exports

function getSurveyDisplayData(survey) {
    const formData = survey.formData || {};
    const schoolName = formData.lori_school_name || 'N/A';
    const respondentName = formData.lori_teacher_name || 'N/A';
    const lga = formData.lori_lgea || 'N/A';
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

    fetch('/api/reports/lori', {
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
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px;">No LORI reports found.</td></tr>';
            return;
        }

        tableBody.innerHTML = ''; // Clear previous content

        surveys.forEach(survey => {
            const row = tableBody.insertRow();
            const { schoolName, respondentName, lga } = getSurveyDisplayData(survey);

            row.innerHTML = `
                <td>${schoolName} (${lga})</td>
                <td>${respondentName}</td>
                <td>${new Date(survey.createdAt).toLocaleString()}</td>
                <td><button class="btn" onclick='viewDetails(${JSON.stringify(survey)})'>View Details</button></td>
            `;
        });
    })
    .catch(error => {
        if (error.message !== 'Access Denied') {
            loadingMessage.innerHTML = '<strong>Failed to load reports.</strong><br>Please ensure the backend server is running and accessible.';
        }
        console.error('Error fetching LORI reports:', error);
    });
});

const modal = document.getElementById('detailsModal');
const modalData = document.getElementById('modal-data');

function viewDetails(survey) {
    modalData.textContent = JSON.stringify(survey, null, 2);
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

function exportToPDF() {
    if (allSurveys.length === 0) {
        alert("No data to export.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("LORI Survey Reports", 14, 16);

    const table = document.getElementById('reportsTable');
    const tableClone = table.cloneNode(true);
    Array.from(tableClone.rows).forEach(row => row.deleteCell(-1)); // Remove "Actions" column

    doc.autoTable({ html: tableClone });

    doc.save('lori-survey-reports.pdf');
}

function exportToExcel() {
    if (allSurveys.length === 0) {
        alert("No data to export.");
        return;
    }

    const loriFieldMapping = {
        "lori_b_1_a": { standard: "1. Subject content knowledge", subCategory: "a) The content is relevant" },
        "lori_b_1_b": { standard: "1. Subject content knowledge", subCategory: "b) The content is delivered logically and sequentially" },
        "lori_b_2_a": { standard: "2. Planning the lesson", subCategory: "a) The teacher prepared a lesson plan" },
        "lori_b_2_b": { standard: "2. Planning the lesson", subCategory: "b) The introduction was stimulating and aroused the interest and curiosity of the learners" },
        "lori_b_2_c": { standard: "2. Planning the lesson", subCategory: "c) The teacher referred to previous lessons and skills" },
        "lori_b_3_a": { standard: "3. Presentation and pedagogy", subCategory: "a) Every learner is involved in learning and enjoying it" },
        "lori_b_3_b": { standard: "3. Presentation and pedagogy", subCategory: "b) The teacher uses a variety of instructional materials to explain the concept" },
        "lori_b_3_c": { standard: "3. Presentation and pedagogy", subCategory: "c) The learners use a variety of instructional materials to practice the concept" },
        "lori_b_3_d": { standard: "3. Presentation and pedagogy", subCategory: "d) The learners have relevant text/workbooks" },
        "lori_b_3_e": { standard: "3. Presentation and pedagogy", subCategory: "e) The learners have relevant writing materials such as pencils, biro, colouring pens, etc." },
        "lori_b_3_f": { standard: "3. Presentation and pedagogy", subCategory: "f) The teacher uses /displays audio-visual materials in the class" },
        "lori_b_3_g": { standard: "3. Presentation and pedagogy", subCategory: "g) The teacher uses various ways of grouping learners" },
        "lori_b_3_h": { standard: "3. Presentation and pedagogy", subCategory: "h) The teacher uses language that is relevant and understandable to the learners" },
        "lori_b_3_i": { standard: "3. Presentation and pedagogy", subCategory: "i) The teacher gives clear instructions to the learners" },
        "lori_b_3_j": { standard: "3. Presentation and pedagogy", subCategory: "j) New words and concepts are clearly explained and related to learners’ experiences" },
        "lori_b_4_a": { standard: "4. Relationship with learners", subCategory: "a) The teacher uses learners’ names when addressing them individually" },
        "lori_b_4_b": { standard: "4. Relationship with learners", subCategory: "b) The teacher is fair and inclusive in their teaching and feedback" },
        "lori_b_4_c": { standard: "4. Relationship with learners", subCategory: "c) The teacher has empathy for the learners" },
        "lori_b_4_d": { standard: "4. Relationship with learners", subCategory: "d) The teacher responds to individual learners according to their need" },
        "lori_b_4_e": { standard: "4. Relationship with learners", subCategory: "e) The teacher is a role model to the learners" },
        "lori_b_5_a": { standard: "5. Class management", subCategory: "a) Every learner can see the teacher and the board" },
        "lori_b_5_b": { standard: "5. Class management", subCategory: "b) The teacher praises and rewards the learners" },
        "lori_b_5_c": { standard: "5. Class management", subCategory: "c) The teacher encourages good behaviour among learners" },
        "lori_b_5_d": { standard: "5. Class management", subCategory: "d) The teacher is confident in his/her presentation" },
        "lori_b_5_e": { standard: "5. Class management", subCategory: "e) The teacher does not use a cane, use physical force, or threatens learners" },
        "lori_b_6_a": { standard: "6. Evaluation of learning", subCategory: "a) The lesson objectives are clearly stated at the beginning of the lesson" },
        "lori_b_6_b": { standard: "6. Evaluation of learning", subCategory: "b) The teacher walks around the room for effective teaching and learning" },
        "lori_b_6_c": { standard: "6. Evaluation of learning", subCategory: "c) The teacher uses a variety of assessment techniques" },
        "lori_b_6_d": { standard: "6. Evaluation of learning", subCategory: "d) The teacher invites learners to ask questions and responds appropriately" },
        "lori_b_6_e": { standard: "6. Evaluation of learning", subCategory: "e) The teacher checks the achievement of the lesson objectives at the end of the lesson through relevant text" },
        "lori_b_6_f": { standard: "6. Evaluation of learning", subCategory: "f) The teacher gave relevant homework if need be" },
        "lori_b_7":   { standard: "7. Overall Assessment", subCategory: "" },
    };

    const worksheetData = allSurveys.flatMap(survey => {
        const { createdAt, formData } = survey;
        const loriRows = [];
        const baseData = {
            'Survey Type': 'lori',
            'Submission Date': new Date(createdAt).toLocaleString(),
        };

        // Add all non-lori_b fields to the base data
        for (const [key, value] of Object.entries(formData)) {
            if (!key.startsWith('lori_b_')) {
                if (typeof value !== 'object' || value === null) {
                    baseData[key] = value;
                } else {
                    baseData[key] = JSON.stringify(value);
                }
            }
        }

        // Create a new row for each lori_b field
        for (const [key, value] of Object.entries(formData)) {
            if (key.startsWith('lori_b_')) {
                const mapping = loriFieldMapping[key];
                if (mapping) {
                    const newRow = {
                        ...baseData,
                        'Teacher Standard': mapping.standard,
                        'Sub-category': mapping.subCategory,
                        'Rating (1-5)': value
                    };
                    loriRows.push(newRow);
                }
            }
        }
        return loriRows;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LORI Reports");

    XLSX.writeFile(workbook, "lori-survey-reports.xlsx");
}
