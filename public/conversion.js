// Conversion Modal Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Modal Elements
    const conversionModal = document.getElementById('conversionModal');
    const conversionFileInput = document.getElementById('conversionFileInput');
    const conversionFileName = document.getElementById('conversionFileName');
    const conversionFileSize = document.getElementById('conversionFileSize');
    const conversionAnalyzeBtn = document.getElementById('conversionAnalyzeBtn');
    const conversionUploadState = document.getElementById('conversionUploadState');
    const conversionLoadingState = document.getElementById('conversionLoadingState');
    const conversionSuccessState = document.getElementById('conversionSuccessState');
    const conversionDownloadLink = document.getElementById('conversionDownloadLink');
    const conversionUploadIcon = document.getElementById('conversionUploadIcon');
    const conversionFileIcon = document.getElementById('conversionFileIcon');
    const conversionPdfIcon = document.getElementById('conversionPdfIcon');
    const conversionWordIcon = document.getElementById('conversionWordIcon');
    const conversionFileDetails = document.getElementById('conversionFileDetails');
    const conversionOptions = document.getElementById('conversionOptions');
    const convertToPdf = document.getElementById('convertToPdf');
    const convertToWord = document.getElementById('convertToWord');
    const closeConversionModalBtn = document.getElementById('closeConversionModal');

    // Open Conversion Modal
    window.openConversionModal = function(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        if (conversionModal) {
            conversionModal.classList.remove('hidden');
            conversionModal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            
            // Reset states
            conversionUploadState.classList.remove('hidden');
            conversionLoadingState.classList.add('hidden');
            conversionSuccessState.classList.add('hidden');
            conversionOptions.classList.add('hidden');
            
            // Reset file input
            conversionFileInput.value = '';
            conversionFileName.textContent = '';
            conversionFileSize.textContent = '';
            conversionAnalyzeBtn.disabled = true;
            
            // Reset icons
            conversionUploadIcon.classList.remove('hidden');
            conversionFileIcon.classList.add('hidden');
            conversionPdfIcon.classList.add('hidden');
            conversionWordIcon.classList.add('hidden');
        }
    };

    // Close Conversion Modal
    window.closeConversionModal = function() {
        if (conversionModal) {
            conversionModal.classList.add('hidden');
            conversionModal.classList.remove('flex');
            document.body.classList.remove('overflow-hidden');
        }
    };

    // Handle file input change
    if (conversionFileInput) {
        conversionFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Check file size (5MB limit)
                if (file.size > 5 * 1024 * 1024) {
                    alert('File size exceeds 5MB limit');
                    conversionFileInput.value = '';
                    conversionAnalyzeBtn.disabled = true;
                    return;
                }
                
                // Check file type
                const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                if (!validTypes.includes(file.type)) {
                    alert('Please upload a PDF or Word document');
                    conversionFileInput.value = '';
                    conversionAnalyzeBtn.disabled = true;
                    return;
                }
                
                // Update file display
                conversionUploadIcon.classList.add('hidden');
                conversionFileIcon.classList.remove('hidden');
                
                // Show appropriate icon
                if (file.type === 'application/pdf') {
                    conversionPdfIcon.classList.remove('hidden');
                    conversionWordIcon.classList.add('hidden');
                } else {
                    conversionPdfIcon.classList.add('hidden');
                    conversionWordIcon.classList.remove('hidden');
                }
                
                // Update file details
                conversionFileDetails.classList.remove('hidden');
                conversionFileName.textContent = file.name;
                conversionFileSize.textContent = formatFileSize(file.size);
                
                // Enable analyze button
                conversionAnalyzeBtn.disabled = false;
                conversionAnalyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                // Reset display if no file selected
                conversionUploadIcon.classList.remove('hidden');
                conversionFileIcon.classList.add('hidden');
                conversionFileDetails.classList.add('hidden');
                conversionAnalyzeBtn.disabled = true;
                conversionAnalyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });
    }

    // Handle analyze button click
    if (conversionAnalyzeBtn) {
        conversionAnalyzeBtn.addEventListener('click', async () => {
            const file = conversionFileInput.files[0];
            if (!file) {
                alert('Please select a file first');
                return;
            }

            // Show loading state
            conversionUploadState.classList.add('hidden');
            conversionLoadingState.classList.remove('hidden');

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('targetFormat', file.type === 'application/pdf' ? 'docx' : 'pdf');

                const response = await fetch('/convert-file', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error('Failed to convert file');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                conversionDownloadLink.href = url;
                conversionDownloadLink.download = file.name.replace(/\.[^/.]+$/, '') + (file.type === 'application/pdf' ? '.docx' : '.pdf');

                // Show success state
                conversionLoadingState.classList.add('hidden');
                conversionSuccessState.classList.remove('hidden');

            } catch (error) {
                console.error('Error:', error);
                alert('Failed to convert file. Please try again.');
                conversionUploadState.classList.remove('hidden');
                conversionLoadingState.classList.add('hidden');
            }
        });
    }

    // Close button handling
    if (closeConversionModalBtn) {
        closeConversionModalBtn.addEventListener('click', closeConversionModal);
    }

    // Close on outside click
    if (conversionModal) {
        conversionModal.addEventListener('click', (e) => {
            if (e.target === conversionModal) {
                closeConversionModal();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && conversionModal && !conversionModal.classList.contains('hidden')) {
            closeConversionModal();
        }
    });
});

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 