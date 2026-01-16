// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const audioInput = document.getElementById('audioInput');
const imageFileName = document.getElementById('imageFileName');
const audioFileName = document.getElementById('audioFileName');
const imageUploadCard = document.getElementById('imageUploadCard');
const audioUploadCard = document.getElementById('audioUploadCard');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const resultBox = document.getElementById('resultBox');
const resultContent = document.getElementById('resultContent');

// State
let imageFile = null;
let audioFile = null;

// File input handlers
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        imageFile = file;
        imageFileName.textContent = file.name;
        imageUploadCard.classList.add('selected');
        updateButtonState();
    }
});

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        audioFile = file;
        audioFileName.textContent = file.name;
        audioUploadCard.classList.add('selected');
        updateButtonState();
    }
});

// Drag and drop for cards
[imageUploadCard, audioUploadCard].forEach((card, index) => {
    card.addEventListener('dragover', (e) => {
        e.preventDefault();
        card.classList.add('selected');
    });

    card.addEventListener('dragleave', () => {
        if ((index === 0 && !imageFile) || (index === 1 && !audioFile)) {
            card.classList.remove('selected');
        }
    });

    card.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            if (index === 0) {
                if (file.type.startsWith('image/')) {
                    imageFile = file;
                    imageFileName.textContent = file.name;
                    imageUploadCard.classList.add('selected');
                }
            } else {
                if (file.type.startsWith('audio/')) {
                    audioFile = file;
                    audioFileName.textContent = file.name;
                    audioUploadCard.classList.add('selected');
                }
            }
            updateButtonState();
        }
    });
});

function updateButtonState() {
    generateBtn.disabled = !(imageFile && audioFile);
}

// Form submission
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!imageFile || !audioFile) {
        alert('Por favor, selecione uma imagem e um áudio antes de gerar o vídeo.');
        showResult({ error: 'Por favor, selecione uma imagem e um áudio.' }, false);
        return;
    }

    // Show loading state
    setLoading(true);
    hideResult();

    try {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('audio', audioFile);

        const response = await fetch('/api/generate-video', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        showResult(data, response.ok);
    } catch (error) {
        showResult({ error: error.message || 'Erro de conexão com o servidor' }, false);
    } finally {
        setLoading(false);
    }
});

function setLoading(loading) {
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoader = generateBtn.querySelector('.btn-loader');

    if (loading) {
        btnText.hidden = true;
        btnLoader.hidden = false;
        generateBtn.disabled = true;
    } else {
        btnText.hidden = false;
        btnLoader.hidden = true;
        updateButtonState();
    }
}

function showResult(data, success) {
    resultSection.hidden = false;
    resultBox.classList.remove('success', 'error');
    resultBox.classList.add(success ? 'success' : 'error');
    resultContent.textContent = JSON.stringify(data, null, 2);
}

function hideResult() {
    resultSection.hidden = true;
}
// Initial check
window.addEventListener('load', () => {
    // Force reset of loading state
    setLoading(false);
    updateButtonState();
});
