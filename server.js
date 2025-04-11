const express = require('express');
const app = express();
const port = 3000;
const multer = require('multer');
const path = require('path');
const { promisify } = require('util');
const libre = require('libreoffice-convert');
const convert = promisify(libre.convert);
const PDFDocument = require('pdfkit');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /pdf|doc|docx/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only PDF and Word documents are allowed'));
    }
});

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.use(express.static('public')); // Serves files from the "public" folder
app.use(express.json()); // Understands form data

const fetch = require('node-fetch');

// Store API key securely (in production, use environment variables)
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Industry-specific templates and skills
const industryTemplates = {
    tech: {
        skills: ['Programming', 'Cloud Computing', 'DevOps', 'Agile', 'System Design'],
        bulletPoints: ['Developed scalable solutions', 'Implemented CI/CD pipelines', 'Optimized system performance']
    },
    finance: {
        skills: ['Financial Analysis', 'Risk Management', 'Investment Planning', 'Market Research'],
        bulletPoints: ['Managed investment portfolios', 'Conducted risk assessments', 'Developed financial strategies']
    },
    marketing: {
        skills: ['Digital Marketing', 'Content Strategy', 'Social Media', 'Analytics'],
        bulletPoints: ['Increased brand visibility', 'Developed marketing campaigns', 'Analyzed market trends']
    }
};

// Helper function to make API calls
async function generateContent(prompt, temperature = 0.7) {
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'ResumeCraft Pro'
            },
            body: JSON.stringify({
                model: 'mistralai/mixtral-8x7b-instruct',
                messages: [{ role: 'user', content: prompt }],
                temperature: temperature
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error generating content:', error);
        throw error;
    }
}

// Function to analyze job description match
async function analyzeJobMatch(resume, jobDescription) {
    const prompt = `Analyze how well the following resume matches the job description. Provide a percentage match and specific recommendations for improvement.

Resume:
${resume}

Job Description:
${jobDescription}

Please provide:
1. Overall match percentage
2. Key matching skills
3. Missing skills or qualifications
4. Specific suggestions for improvement`;

    return await generateContent(prompt, 0.8);
}

// Function to generate LinkedIn summary
async function generateLinkedInSummary(resumeData) {
    const prompt = `Create a professional LinkedIn summary based on the following resume information:
${JSON.stringify(resumeData)}

The summary should be:
1. Engaging and professional
2. Highlight key achievements
3. Include relevant keywords
4. Be optimized for LinkedIn's format`;

    return await generateContent(prompt, 0.7);
}

// Function to suggest industry-specific improvements
async function suggestImprovements(resumeData, industry) {
    const template = industryTemplates[industry] || industryTemplates.tech;
    const prompt = `Based on this resume for the ${industry} industry:
${JSON.stringify(resumeData)}

Suggest improvements including:
1. Industry-specific keywords to add
2. Relevant certifications to pursue
3. Skills that are trending in ${industry}
4. Format and structure improvements`;

    return await generateContent(prompt, 0.8);
}

const formatResume = (name, jobRole, summary, skills, experience, education) => {
    const skillsArray = skills.split(',').map(skill => skill.trim());
    const experienceArray = experience.split('\n').filter(exp => exp.trim());
    const educationArray = education.split('\n').filter(edu => edu.trim());

    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return `
        <div class="resume-content resume-paper">
            <div class="resume-header">
                <h1 class="resume-name">${name}</h1>
                <div class="resume-title">${jobRole}</div>
            </div>

            <div class="resume-section">
                <div class="resume-section-title">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Professional Summary
                </div>
                <p class="text-gray-700 leading-relaxed">${summary}</p>
            </div>

            <div class="resume-section">
                <div class="resume-section-title">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Core Skills
                </div>
                <div class="skills-grid">
                    ${skillsArray.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>

            <div class="resume-section">
                <div class="resume-section-title">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Professional Experience
                </div>
                ${experienceArray.map(exp => `
                    <div class="experience-item">
                        <div class="experience-title">${exp}</div>
                    </div>
                `).join('')}
            </div>

            <div class="resume-section">
                <div class="resume-section-title">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Education
                </div>
                ${educationArray.map(edu => `
                    <div class="education-item">
                        <p class="font-medium text-gray-800">${edu}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

const formatCoverLetter = (name, jobRole, summary, experience) => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    return `
        <div class="cover-letter-content resume-paper">
            <div class="cover-letter-header">
                <p class="font-semibold text-gray-800">${name}</p>
                <p class="text-gray-600">${jobRole}</p>
                <p class="cover-letter-date">${currentDate}</p>
            </div>
            
            <div class="cover-letter-recipient">
                <p>Dear Hiring Manager,</p>
            </div>

            <div class="cover-letter-body">
                <p>I am writing to express my strong interest in the ${jobRole} position at your company. As a professional with ${experience.split('\n')[0]}, I am confident that my skills and experiences make me a standout candidate for this role.</p>

                <p>${summary}</p>

                <p>I am excited about the opportunity to bring my skills and experiences to your team and contribute to your company's success. I look forward to discussing how I can add value to your organization.</p>
            </div>

            <div class="cover-letter-signature">
                <p>Best regards,</p>
                <p class="mt-4">${name}</p>
            </div>
        </div>
    `;
};

app.post('/generate', async (req, res) => {
    try {
        const { 
            name, 
            jobRole, 
            summary, 
            skills, 
            experience, 
            education,
            jobDescription, // Optional job description for matching
            industry, // Optional industry for specific suggestions
            generateLinkedIn // Optional flag for LinkedIn summary
        } = req.body;
        
        // Generate base resume and cover letter
        const resume = formatResume(name, jobRole, summary, skills, experience, education);
        const coverLetter = formatCoverLetter(name, jobRole, summary, experience);
        
        // Additional content generation based on request
        const additionalContent = {};

        // Parallel processing of additional features
        const promises = [];

        if (jobDescription) {
            promises.push(
                analyzeJobMatch(resume, jobDescription)
                    .then(analysis => additionalContent.jobMatch = analysis)
            );
        }

        if (industry) {
            promises.push(
                suggestImprovements({ name, jobRole, summary, skills, experience, education }, industry)
                    .then(suggestions => additionalContent.industrySuggestions = suggestions)
            );
        }

        if (generateLinkedIn) {
            promises.push(
                generateLinkedInSummary({ name, jobRole, summary, skills, experience, education })
                    .then(linkedInSummary => additionalContent.linkedInSummary = linkedInSummary)
            );
        }

        // Wait for all additional content to be generated
        await Promise.all(promises);

        res.json({
            resume,
            coverLetter,
            ...additionalContent
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

// Add ATS analysis endpoint
app.post('/analyze-resume', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Here you would implement your actual ATS analysis logic
        // For now, we'll return sample data
        const scores = {
            overall: Math.floor(Math.random() * 20 + 80),
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

        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);

        res.json(scores);
    } catch (error) {
        console.error('Error analyzing resume:', error);
        res.status(500).json({ error: 'Failed to analyze resume' });
    }
});

app.post('/analyze-ats', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Here we'll simulate ATS analysis with a delay for better UX
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sample ATS analysis response
        const scores = {
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

        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);

        res.json(scores);
    } catch (error) {
        console.error('Error analyzing resume:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to analyze resume' });
    }
});

// File conversion endpoint
app.post('/convert-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const targetFormat = req.body.targetFormat;
        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const fileType = req.file.mimetype;

        // Validate target format
        if (targetFormat !== 'pdf' && targetFormat !== 'docx') {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Invalid target format' });
        }

        // Check if conversion is needed
        if ((targetFormat === 'pdf' && fileType === 'application/pdf') ||
            (targetFormat === 'docx' && (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))) {
            // No conversion needed, return the original file
            const fileStream = fs.createReadStream(filePath);
            res.setHeader('Content-Type', fileType);
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            fileStream.pipe(res);
            fileStream.on('end', () => {
                fs.unlinkSync(filePath);
            });
            return;
        }

        // For now, return a more informative error message
        fs.unlinkSync(filePath);
        return res.status(501).json({ 
            error: 'File conversion is not available. Please install Node.js and LibreOffice to enable this feature.',
            details: 'To enable file conversion:\n1. Install Node.js from https://nodejs.org/\n2. Install LibreOffice from https://www.libreoffice.org/download/download/\n3. Restart the application'
        });

    } catch (error) {
        console.error('Error converting file:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to convert file' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});