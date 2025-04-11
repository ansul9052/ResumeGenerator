const formatResume = (name, jobRole, summary, skills, experience, education) => {
    const skillsArray = skills.split(',').map(skill => skill.trim());
    const experienceArray = experience.split('\n').filter(exp => exp.trim());
    const educationArray = education.split('\n').filter(edu => edu.trim());

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
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

module.exports = {
    formatResume,
    formatCoverLetter
}; 