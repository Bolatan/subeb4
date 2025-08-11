function toggleSection(sectionId, headerId) {
    const section = document.getElementById(sectionId);
    const header = document.getElementById(headerId);
    if (section && header) {
        const isHidden = section.style.display === 'none';
        section.style.display = isHidden ? 'block' : 'none';
        const headerText = header.innerText;
        if (isHidden) {
            header.innerText = headerText.replace('▶️', '🔽');
        } else {
            header.innerText = headerText.replace('🔽', '▶️');
        }
    }
}
