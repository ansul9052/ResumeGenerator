// Track if this is the first submission
let isFirstSubmission = true;

document.getElementById('resumeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const jobRole = document.getElementById('jobRole').value;
    const summary = document.getElementById('summary').value;
    const skills = document.getElementById('skills').value;
    const experience = document.getElementById('experience').value;
    const education = document.getElementById('education').value;
    const jobDescription = document.getElementById('jobDescription')?.value || '';
    const industry = document.getElementById('industry')?.value || '';
    const generateLinkedIn = document.getElementById('generateLinkedIn')?.checked || false;

    // Show loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = 'flex';

    try {
    const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                jobRole, 
                summary, 
                skills, 
                experience, 
                education,
                jobDescription,
                industry,
                generateLinkedIn
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

    const data = await response.json();

        // Update resume output with formatted content
        document.getElementById('resumeOutput').innerHTML = data.resume;
        document.getElementById('coverLetterOutput').innerHTML = data.coverLetter;

        // Update additional sections if they exist
        if (data.jobMatch) {
            const jobMatchSection = document.getElementById('jobMatchSection');
            jobMatchSection.classList.remove('hidden');
            jobMatchSection.innerHTML = formatJobMatchAnalysis(data.jobMatch);
        }

        if (data.industrySuggestions) {
            const suggestionsSection = document.getElementById('industrySuggestionsSection');
            suggestionsSection.classList.remove('hidden');
            suggestionsSection.innerHTML = formatIndustrySuggestions(data.industrySuggestions);
        }

        if (data.linkedInSummary) {
            const linkedInSection = document.getElementById('linkedInSection');
            linkedInSection.classList.remove('hidden');
            linkedInSection.innerHTML = formatLinkedInSummary(data.linkedInSummary);
        }
        
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
        
        // Show the output section with animation
        const outputSection = document.getElementById('output');
        outputSection.classList.remove('hidden');
        outputSection.style.opacity = '0';
        outputSection.style.transform = 'translateY(20px)';
        outputSection.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            outputSection.style.opacity = '1';
            outputSection.style.transform = 'translateY(0)';
        }, 100);

        // Scroll to the output section with smooth animation
        outputSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });

        // Add hover effects to skill tags
        const skillTags = document.querySelectorAll('.skill-tag');
        skillTags.forEach(tag => {
            tag.addEventListener('mouseover', () => {
                tag.style.transform = 'translateY(-2px)';
                tag.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            });
            tag.addEventListener('mouseout', () => {
                tag.style.transform = 'translateY(0)';
                tag.style.boxShadow = 'none';
            });
        });

        // Update download button functionality with loading state
        document.getElementById('downloadBtn').onclick = async () => {
        const element = document.getElementById('output');
            const downloadBtn = document.getElementById('downloadBtn');
            const originalText = downloadBtn.textContent;
            
            try {
                downloadBtn.textContent = 'Preparing PDF...';
                downloadBtn.disabled = true;
                downloadBtn.classList.add('opacity-75');

                const opt = {
                    margin: [0.5, 0.5],
                    filename: `${name.replace(/\s+/g, '_')}_Resume_Package.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2,
                        useCORS: true,
                        logging: false
                    },
                    jsPDF: { 
                        unit: 'in', 
                        format: 'letter', 
                        orientation: 'portrait'
                    },
                    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                };

                await html2pdf().set(opt).from(element).save();
                
                // Show success message
                downloadBtn.textContent = 'Downloaded!';
                downloadBtn.classList.remove('bg-green-600');
                downloadBtn.classList.add('bg-blue-600');
                
                setTimeout(() => {
                    downloadBtn.textContent = originalText;
                    downloadBtn.classList.remove('bg-blue-600');
                    downloadBtn.classList.add('bg-green-600');
                    downloadBtn.disabled = false;
                    downloadBtn.classList.remove('opacity-75');
                }, 2000);
            } catch (error) {
                console.error('PDF generation error:', error);
                downloadBtn.textContent = 'Error - Try Again';
                downloadBtn.classList.add('bg-red-600');
                
                setTimeout(() => {
                    downloadBtn.textContent = originalText;
                    downloadBtn.classList.remove('bg-red-600');
                    downloadBtn.classList.add('bg-green-600');
                    downloadBtn.disabled = false;
                    downloadBtn.classList.remove('opacity-75');
                }, 2000);
            }
        };

    } catch (error) {
        console.error('Error:', error);
        loadingOverlay.style.display = 'none';
        alert('An error occurred while generating your resume. Please try again.');
    }
});

// Format job match analysis
function formatJobMatchAnalysis(analysis) {
    return `
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 class="text-xl font-semibold mb-4 text-blue-600">Job Match Analysis</h3>
            <div class="prose max-w-none">
                ${marked(analysis)}
            </div>
        </div>
    `;
}

// Format industry suggestions
function formatIndustrySuggestions(suggestions) {
    return `
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 class="text-xl font-semibold mb-4 text-purple-600">Industry-Specific Suggestions</h3>
            <div class="prose max-w-none">
                ${marked(suggestions)}
            </div>
        </div>
    `;
}

// Format LinkedIn summary
function formatLinkedInSummary(summary) {
    return `
        <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 class="text-xl font-semibold mb-4 text-blue-800">LinkedIn Summary</h3>
            <div class="prose max-w-none">
                ${marked(summary)}
            </div>
            <button onclick="copyToClipboard(this)" 
                class="mt-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg hover:bg-blue-200 transition duration-300">
                Copy to Clipboard
            </button>
        </div>
    `;
}

// Copy to clipboard function
async function copyToClipboard(button) {
    const content = button.previousElementSibling.textContent;
    try {
        await navigator.clipboard.writeText(content);
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.classList.add('bg-green-100', 'text-green-800');
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('bg-green-100', 'text-green-800');
            button.classList.add('bg-blue-100', 'text-blue-800');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy to clipboard');
    }
}

// Add input validation and character count
const textareas = document.querySelectorAll('textarea');
textareas.forEach(textarea => {
    // Only apply limits to summary and skills
    const maxLength = textarea.id === 'summary' ? 500 : 
                     textarea.id === 'skills' ? 500 : 
                     null; // No limit for experience, education, and jobDescription

    if (maxLength) {
        const charCount = document.createElement('div');
        charCount.className = 'text-sm text-gray-500 mt-1';
        
        const countText = document.createElement('span');
        charCount.appendChild(countText);
        textarea.parentNode.appendChild(charCount);

        // Handle input and paste events
        const handleInput = () => {
            if (maxLength) {
                const currentLength = textarea.value.length;
                const remaining = maxLength - currentLength;
                
                if (remaining < 0) {
                    countText.textContent = '';
                } else {
                    countText.textContent = `${remaining} characters remaining`;
                }
            }
        };

        // Handle paste event to limit pasted content
        textarea.addEventListener('paste', (e) => {
            if (maxLength) {
                e.preventDefault();
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                const currentText = textarea.value;
                const selectionStart = textarea.selectionStart;
                const selectionEnd = textarea.selectionEnd;
                
                const newText = currentText.substring(0, selectionStart) + 
                               pastedText.substring(0, maxLength - (currentText.length - (selectionEnd - selectionStart))) + 
                               currentText.substring(selectionEnd);
                
                textarea.value = newText;
                handleInput();
            }
        });

        textarea.addEventListener('input', handleInput);
    }
});

// Check Node.js and npm versions
console.log('Node.js version:', process.version);
console.log('npm version:', process.env.npm_package_version);

// Simple Modal Functions
function openPricingModal() {
    const modal = document.getElementById('pricingModal');
    modal.classList.remove('hidden');
    
    // Add animation classes
    const modalContent = modal.querySelector('.bg-white');
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
    
    // Trigger animation
    setTimeout(() => {
        modalContent.style.opacity = '1';
        modalContent.style.transform = 'scale(1)';
    }, 10);
}

function closePricingModal() {
    const modal = document.getElementById('pricingModal');
    const modalContent = modal.querySelector('.bg-white');
    
    // Animate out
    modalContent.style.opacity = '0';
    modalContent.style.transform = 'scale(0.95)';
    
    // Hide modal after animation
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('pricingModal');
    if (e.target === modal) {
        closePricingModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePricingModal();
    }
});

// ATS Modal Functions
function openAtsModal(event) {
    event.preventDefault();
    const modal = document.getElementById('atsModal');
    modal.classList.remove('hidden');
    
    // Reset states
    document.getElementById('uploadState').classList.remove('hidden');
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('resultsState').classList.add('hidden');
    
    // Reset file input
    document.getElementById('resumeFile').value = '';
    document.getElementById('analyzeBtn').disabled = true;
}

function closeAtsModal() {
    const modal = document.getElementById('atsModal');
    modal.classList.add('hidden');
}

// Handle file upload
document.getElementById('resumeFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (file) {
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit');
            this.value = '';
            analyzeBtn.disabled = true;
            return;
        }
        
        // Check file type
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF or Word document');
            this.value = '';
            analyzeBtn.disabled = true;
            return;
        }
        
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
});

// Handle resume analysis
document.getElementById('analyzeBtn').addEventListener('click', async function() {
    const fileInput = document.getElementById('resumeFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file first');
        return;
    }

    // Show loading state
    document.getElementById('uploadState').classList.add('hidden');
    document.getElementById('loadingState').classList.remove('hidden');
    
    let progress = 0;
    const progressElement = document.getElementById('analysisProgress');
    const statusElement = document.getElementById('analysisStatus');
    
    // Simulate analysis progress
    const progressInterval = setInterval(() => {
        if (progress < 95) {
            progress += Math.random() * 15;
            progressElement.textContent = Math.min(Math.round(progress), 95) + '%';
            
            // Update status messages
            if (progress < 30) {
                statusElement.textContent = 'Scanning document structure...';
            } else if (progress < 60) {
                statusElement.textContent = 'Analyzing content and keywords...';
            } else if (progress < 90) {
                statusElement.textContent = 'Evaluating ATS compatibility...';
            }
        }
    }, 800);

    try {
        // Create FormData object
        const formData = new FormData();
        formData.append('resume', file);

        // Send file to server
        const response = await fetch('/analyze-resume', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to analyze resume');
        }

        const scores = await response.json();
        
        // Update UI with results
        updateAtsResults(scores);
        
        // Complete progress animation
        clearInterval(progressInterval);
        progressElement.textContent = '100%';
        
        // Show results
        setTimeout(() => {
            document.getElementById('loadingState').classList.add('hidden');
            document.getElementById('resultsState').classList.remove('hidden');
        }, 500);
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('An error occurred during analysis. Please try again.');
        closeAtsModal();
    }
});

// Calculate ATS scores
function calculateAtsScores() {
    // This is where you would implement your actual ATS scoring logic
    // For now, we'll use a sample scoring system
    return {
        overall: Math.floor(Math.random() * 20 + 80), // Score between 80-100
        format: {
            score: Math.floor(Math.random() * 20 + 80),
            details: [
                'Clean, standard formatting detected',
                'Professional font usage',
                'Proper section headings found'
            ]
        },
        keywords: {
            score: Math.floor(Math.random() * 20 + 80),
            details: [
                'Industry-relevant keywords detected',
                'Good keyword density',
                'Key skills properly highlighted'
            ]
        },
        recommendations: [
            'Add more quantifiable achievements',
            'Include industry-specific certifications',
            'Optimize section headings for better ATS recognition',
            'Consider adding more action verbs'
        ]
    };
}

// Update results UI
function updateAtsResults(scores) {
    // Update overall score
    const overallScore = document.getElementById('overallScore');
    const scoreBar = document.getElementById('scoreBar');
    overallScore.textContent = scores.overall + '%';
    scoreBar.style.width = scores.overall + '%';
    
    // Update format score
    const formatScore = document.getElementById('formatScore');
    formatScore.innerHTML = `
        <div class="font-semibold mb-2">${scores.format.score}% Compatible</div>
        <ul class="text-sm space-y-1">
            ${scores.format.details.map(detail => `
                <li class="flex items-center">
                    <svg class="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    ${detail}
                </li>
            `).join('')}
        </ul>
    `;
    
    // Update keyword score
    const keywordScore = document.getElementById('keywordScore');
    keywordScore.innerHTML = `
        <div class="font-semibold mb-2">${scores.keywords.score}% Optimized</div>
        <ul class="text-sm space-y-1">
            ${scores.keywords.details.map(detail => `
                <li class="flex items-center">
                    <svg class="w-4 h-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    ${detail}
                </li>
            `).join('')}
        </ul>
    `;
    
    // Update recommendations
    const recommendations = document.getElementById('recommendations');
    recommendations.innerHTML = scores.recommendations.map(rec => `
        <li class="flex items-start">
            <svg class="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            ${rec}
        </li>
    `).join('');
}

// Close modal when clicking outside
document.getElementById('atsModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeAtsModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeAtsModal();
    }
});

// Conversion Modal Functionality
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

// Event Listeners for Conversion Modal
document.addEventListener('DOMContentLoaded', () => {
    const oneClickExportBtn = document.getElementById('oneClickExportBtn');
    const closeConversionModalBtn = document.getElementById('closeConversionModal');
    const conversionFileInput = document.getElementById('conversionFileInput');
    const conversionAnalyzeBtn = document.getElementById('conversionAnalyzeBtn');
    const modalContent = conversionModal ? conversionModal.querySelector('.modal-content') : null;
    const modalBackdrop = conversionModal ? conversionModal.querySelector('.modal-backdrop') : null;

    // Initialize modal state
    if (conversionModal) {
        conversionModal.classList.add('hidden');
    }

    function showModal() {
        if (conversionModal) {
            conversionModal.classList.remove('hidden');
            
            // Reset states
            const uploadState = document.getElementById('conversionUploadState');
            const loadingState = document.getElementById('conversionLoadingState');
            const successState = document.getElementById('conversionSuccessState');
            
            if (uploadState) uploadState.classList.remove('hidden');
            if (loadingState) loadingState.classList.add('hidden');
            if (successState) successState.classList.add('hidden');
            
            // Reset file input
            const fileInput = document.getElementById('conversionFileInput');
            const fileName = document.getElementById('conversionFileName');
            const fileSize = document.getElementById('conversionFileSize');
            const analyzeBtn = document.getElementById('conversionAnalyzeBtn');
            
            if (fileInput) fileInput.value = '';
            if (fileName) fileName.textContent = '';
            if (fileSize) fileSize.textContent = '';
            if (analyzeBtn) analyzeBtn.disabled = true;
            
            // Reset icons
            const uploadIcon = document.getElementById('conversionUploadIcon');
            const fileIcon = document.getElementById('conversionFileIcon');
            const pdfIcon = document.getElementById('conversionPdfIcon');
            const wordIcon = document.getElementById('conversionWordIcon');
            
            if (uploadIcon) uploadIcon.classList.remove('hidden');
            if (fileIcon) fileIcon.classList.add('hidden');
            if (pdfIcon) pdfIcon.classList.add('hidden');
            if (wordIcon) wordIcon.classList.add('hidden');
        }
    }

    function hideModal() {
        if (conversionModal) {
            conversionModal.classList.add('hidden');
        }
    }

    // Event listener for One-Click Export button
    if (oneClickExportBtn) {
        oneClickExportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showModal();
        });
    }

    // Close modal when clicking outside
    if (conversionModal) {
        conversionModal.addEventListener('click', (e) => {
            if (e.target === conversionModal) {
                hideModal();
            }
        });
    }

    // Close modal with close button
    if (closeConversionModalBtn) {
        closeConversionModalBtn.addEventListener('click', () => {
            hideModal();
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && conversionModal && !conversionModal.classList.contains('hidden')) {
            hideModal();
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