async function fetchAllSurveyData(surveyType) {
    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));
    if (!user || !user.token) {
        console.error('Authentication required. Please log in.');
        return null;
    }

    try {
        // First, fetch page 1 to get pagination info
        const firstPageResponse = await fetch(`/api/reports/${surveyType}?page=1`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!firstPageResponse.ok) {
            throw new Error(`HTTP error on first page! status: ${firstPageResponse.status}`);
        }

        const firstPageData = await firstPageResponse.json();
        const allSurveys = firstPageData.responses;
        const totalPages = firstPageData.pagination.totalPages;

        // If there's more than one page, fetch the rest
        if (totalPages > 1) {
            const pagePromises = [];
            for (let page = 2; page <= totalPages; page++) {
                pagePromises.push(
                    fetch(`/api/reports/${surveyType}?page=${page}`, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    }).then(res => {
                        if (!res.ok) {
                            console.error(`Error fetching page ${page} for ${surveyType}: status ${res.status}`);
                            return { responses: [] }; // Return empty on error to not break Promise.all
                        }
                        return res.json();
                    })
                );
            }

            const remainingPagesData = await Promise.all(pagePromises);
            remainingPagesData.forEach(pageData => {
                allSurveys.push(...pageData.responses);
            });
        }

        return allSurveys;

    } catch (error) {
        console.error(`Error fetching all ${surveyType} survey data for export:`, error);
        // No alert here to avoid blocking tests
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
