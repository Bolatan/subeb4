async function fetchAllSurveyData(surveyType) {
    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));
    if (!user || !user.token) {
        console.error('Authentication required. Please log in.');
        return null;
    }

    const allSurveys = [];
    let page = 1;
    let totalPages = 1; // Initialize to 1 to ensure the loop runs at least once
    const limit = 100; // Fetch 100 records per page

    console.log(`Starting to fetch all ${surveyType} data page by page for export.`);

    try {
        while (page <= totalPages) {
            const response = await fetch(`/api/reports/${surveyType}?page=${page}&limit=${limit}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} while fetching page ${page}`);
            }

            const data = await response.json();

            if (data && data.responses && data.responses.length > 0) {
                allSurveys.push(...data.responses);
            }

            // Set totalPages from the first response. It's constant for subsequent pages.
            if (page === 1) {
                totalPages = data.pagination.totalPages;
                if (totalPages === 0) {
                    console.log("No records found.");
                    break;
                }
                console.log(`Total pages to fetch: ${totalPages}`);
            }

            page++;
        }

        console.log(`Finished fetching all data. Total surveys retrieved: ${allSurveys.length}`);
        return allSurveys;

    } catch (error) {
        console.error(`Error fetching all ${surveyType} survey data for export:`, error);
        return null;
    }
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

function exportTableToPDF(tableId, filename) {
    const { jsPDF } = window.jspdf;
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Table with id ${tableId} not found.`);
        return;
    }

    html2canvas(table).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
        });
        const imgProps= pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(filename);
    });
}
