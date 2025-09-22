async function fetchAllSurveyData(surveyType) {
    const user = JSON.parse(localStorage.getItem('auditAppCurrentUser'));
    if (!user || !user.token) {
        console.error('Authentication required. Please log in.');
        return null;
    }

    try {
        const response = await fetch(`/api/reports/${surveyType}/all`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const surveys = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                // Process any remaining data in the buffer
                if (buffer.length > 0) {
                    try {
                        surveys.push(JSON.parse(buffer));
                    } catch (e) {
                        console.error('Error parsing final JSON object:', e);
                    }
                }
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // The last line might be incomplete, so we keep it in the buffer
            buffer = lines.pop();

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    surveys.push(JSON.parse(line));
                } catch (e) {
                    console.error('Error parsing JSON object from stream:', e, 'line:', line);
                }
            }
        }

        return surveys;

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
