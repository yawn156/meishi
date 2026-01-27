document.addEventListener('DOMContentLoaded', () => {
    const boxes = document.querySelectorAll('.interactive-box');
    boxes.forEach(box => {
        box.addEventListener('click', () => {
            const codeElement = box.querySelector('code');
            if (codeElement) {
                const textToCopy = codeElement.textContent;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    console.log(`${textToCopy} copied to clipboard`);
                    box.classList.add('copied');
                    setTimeout(() => {
                        box.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        });
    });
});