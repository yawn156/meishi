document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('popup');

    const showPopup = () => {
        popup.classList.add('show');
        setTimeout(() => {
            popup.classList.remove('show');
        }, 1500);
    };

    const boxes = document.querySelectorAll('.interactive-box');
    boxes.forEach(box => {
        box.addEventListener('click', () => {
            const codeElement = box.querySelector('code');
            if (codeElement) {
                const textToCopy = codeElement.textContent;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    console.log(`${textToCopy} copied to clipboard`);
                    if (window.innerWidth <= 768) {
                        showPopup();
                    } else {
                        box.classList.add('copied');
                        setTimeout(() => {
                            box.classList.remove('copied');
                        }, 2000);
                    }
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        });
    });

    const copySideButton = document.getElementById('copy-side-button');
    if (copySideButton) {
        copySideButton.addEventListener('click', () => {
            const buttonTextSpan = copySideButton.querySelector('.button-text');
            if (buttonTextSpan) {
                const textToCopy = buttonTextSpan.textContent;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    console.log(`${textToCopy} copied to clipboard`);
                    const originalText = buttonTextSpan.textContent;
                    buttonTextSpan.textContent = 'Copied!';
                    copySideButton.style.width = '200px'; // Keep it expanded to show feedback
                    setTimeout(() => {
                        buttonTextSpan.textContent = originalText;
                        copySideButton.style.width = ''; // Revert to original width
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        });
    }

    const copyFooterButton = document.getElementById('copy-footer-button');
    if (copyFooterButton) {
        copyFooterButton.addEventListener('click', () => {
            const buttonTextSpan = copyFooterButton.querySelector('.button-text');
            if (buttonTextSpan) {
                const textToCopy = buttonTextSpan.textContent;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    console.log(`${textToCopy} copied to clipboard`);
                    showPopup();
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        });
    }
});