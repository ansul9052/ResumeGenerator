// ATS Analysis Modal Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Modal Elements
    const atsModal = document.getElementById('atsModal');
    const uploadState = document.getElementById('uploadState');
    const loadingState = document.getElementById('loadingState');
    const resultsState = document.getElementById('resultsState');
    const fileInput = document.getElementById('resumeFile');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const closeBtn = document.getElementById('closeAtsModal');

    // File Display Elements
    const uploadIcon = document.getElementById('uploadIcon');
    const fileIcon = document.getElementById('fileIcon');
    const pdfIcon = document.getElementById('pdfIcon');
    const wordIcon = document.getElementById('wordIcon');
    const fileDetails = document.getElementById('fileDetails');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');

    // Open ATS Modal from Features dropdown
    const atsFeatureItem = document.querySelector('.group .space-y-4 .hover\\:bg-green-50');
    if (atsFeatureItem) {
        atsFeatureItem.addEventListener('click', (e) => {
            e.preventDefault();
            openAtsModal();
        });
    }

    // Open ATS Modal
    window.openAtsModal = function(event) {
        if (event) event.preventDefault();
        atsModal.classList.remove('hidden');
        resetFileDisplay();
    };

    // Close ATS Modal
    window.closeAtsModal = function() {
        atsModal.classList.add('hidden');
        resetModal();
    };

    // Reset file display
    function resetFileDisplay() {
        uploadIcon.classList.remove('hidden');
        fileIcon.classList.add('hidden');
        pdfIcon.classList.add('hidden');
        wordIcon.classList.add('hidden');
        fileDetails.classList.add('hidden');
        fileName.textContent = '';
        fileSize.textContent = '';
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // File input handling
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validate file size
                if (file.size > 5 * 1024 * 1024) {
                    alert('File size exceeds 5MB limit');
                    fileInput.value = '';
                    resetFileDisplay();
                    analyzeBtn.disabled = true;
                    analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    return;
                }

                // Validate file type
                const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!validTypes.includes(file.type)) {
                    alert('Please upload a PDF or Word document');
                    fileInput.value = '';
                    resetFileDisplay();
                    analyzeBtn.disabled = true;
                    analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    return;
                }

                // Update display
                uploadIcon.classList.add('hidden');
                fileIcon.classList.remove('hidden');

                // Show appropriate icon
                if (file.type === 'application/pdf') {
                    pdfIcon.classList.remove('hidden');
                    wordIcon.classList.add('hidden');
                } else {
                    pdfIcon.classList.add('hidden');
                    wordIcon.classList.remove('hidden');
                }

                // Update file details
                fileDetails.classList.remove('hidden');
                fileName.textContent = file.name;
                fileSize.textContent = formatFileSize(file.size);

                // Enable analyze button
                analyzeBtn.disabled = false;
                analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                resetFileDisplay();
                analyzeBtn.disabled = true;
                analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
    }

    // Analyze button handling
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            // Show loading state
            uploadState.classList.add('hidden');
            loadingState.classList.remove('hidden');

            const formData = new FormData();
            formData.append('resume', file);

            try {
                const response = await fetch('/analyze-ats', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Failed to analyze resume');
                }

                const data = await response.json();
                
                // Update UI with results
                document.getElementById('overallScore').textContent = data.overall + '%';
                
                // Update format details
                const formatDetails = document.getElementById('formatDetails');
                formatDetails.innerHTML = data.format.details.map(detail => `
                    <li class="flex items-center space-x-2">
                        <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>${detail}</span>
                    </li>
                `).join('');

                // Update keyword details
                const keywordDetails = document.getElementById('keywordDetails');
                keywordDetails.innerHTML = data.keywords.details.map(detail => `
                    <li class="flex items-center space-x-2">
                        <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>${detail}</span>
                    </li>
                `).join('');

                // Update recommendations
                const recommendations = document.getElementById('recommendations');
                recommendations.innerHTML = data.recommendations.map(rec => `
                    <li class="flex items-center space-x-2">
                        <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        <span>${rec}</span>
                    </li>
                `).join('');

                // Show results
                loadingState.classList.add('hidden');
                resultsState.classList.remove('hidden');

            } catch (error) {
                console.error('Error:', error);
                alert('Failed to analyze resume. Please try again.');
                uploadState.classList.remove('hidden');
                loadingState.classList.add('hidden');
            }
        });
    }

    // Close button handling
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAtsModal);
    }

    // Close on outside click
    atsModal.addEventListener('click', (e) => {
        if (e.target === atsModal) {
            closeAtsModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !atsModal.classList.contains('hidden')) {
            closeAtsModal();
        }
    });

    // Reset modal state
    function resetModal() {
        if (fileInput) fileInput.value = '';
        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        uploadState.classList.remove('hidden');
        loadingState.classList.add('hidden');
        resultsState.classList.add('hidden');
    }
}); 