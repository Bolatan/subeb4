document.addEventListener('DOMContentLoaded', function() {
    const makeFieldsRequired = (form) => {
        const elements = form.querySelectorAll('input, select, textarea');
        const radioGroups = {};

        elements.forEach(element => {
            if (element.type === 'button' || element.type === 'submit' || element.type === 'reset' || element.type === 'hidden' || element.type === 'file' || element.hasAttribute('readonly')) {
                return;
            }
            if (element.type === 'radio') {
                if (!radioGroups[element.name]) {
                    radioGroups[element.name] = true;
                    element.required = true;
                }
            } else if (element.type !== 'checkbox') {
                element.required = true;
            }
        });
    };

    const initProgressiveEnabling = (form) => {
        const elements = Array.from(form.querySelectorAll('input:not([type=hidden]), select, textarea'))
                              .filter(el => !['button', 'submit', 'reset', 'file'].includes(el.type) && !el.hasAttribute('readonly'));

        if (elements.length === 0) return;

        for (let i = 1; i < elements.length; i++) {
            elements[i].disabled = true;
        }

        elements.forEach((element, index) => {
            const eventType = (element.tagName.toLowerCase() === 'select' || element.type === 'radio' || element.type === 'checkbox') ? 'change' : 'input';

            element.addEventListener(eventType, () => {
                if (element.checkValidity()) {
                    let nextIndex = index + 1;
                    if (element.type === 'radio') {
                        while (elements[nextIndex] && elements[nextIndex].type === 'radio' && elements[nextIndex].name === element.name) {
                            elements[nextIndex].disabled = false; // Also enable other radios in the group
                            nextIndex++;
                        }
                    }

                    if (elements[nextIndex]) {
                        elements[nextIndex].disabled = false;
                        // If the next element is a radio, enable its whole group
                        if(elements[nextIndex].type === 'radio') {
                            const groupName = elements[nextIndex].name;
                            const group = form.querySelectorAll(`input[name="${groupName}"]`);
                            group.forEach(radio => radio.disabled = false);
                        }
                    }
                }
            });
        });
    };

    const surveyObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const section = mutation.target;
                if (!section.classList.contains('hidden') && section.querySelector('form')) {
                    const form = section.querySelector('form');
                    makeFieldsRequired(form);
                    initProgressiveEnabling(form);
                }
            }
        }
    });

    const surveySections = document.querySelectorAll('.section');
    surveySections.forEach(section => {
        surveyObserver.observe(section, { attributes: true });
    });

    // Also run for any forms that might be visible on load (e.g. if login is skipped)
    const allForms = document.querySelectorAll('form');
    allForms.forEach(form => {
        if (form.offsetParent !== null) { // is visible
             makeFieldsRequired(form);
             initProgressiveEnabling(form);
        }
    });
});
