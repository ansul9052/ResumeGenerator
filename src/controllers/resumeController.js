const openRouterService = require('../services/openRouterService');
const { formatResume, formatCoverLetter } = require('../utils/formatters');

class ResumeController {
    async generateResume(req, res) {
        try {
            const { 
                name, 
                jobRole, 
                summary, 
                skills, 
                experience, 
                education,
                jobDescription,
                industry,
                generateLinkedIn
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
                    openRouterService.analyzeJobMatch(resume, jobDescription)
                        .then(analysis => additionalContent.jobMatch = analysis)
                );
            }

            if (industry) {
                promises.push(
                    openRouterService.suggestImprovements({ name, jobRole, summary, skills, experience, education }, industry)
                        .then(suggestions => additionalContent.industrySuggestions = suggestions)
                );
            }

            if (generateLinkedIn) {
                promises.push(
                    openRouterService.generateLinkedInSummary({ name, jobRole, summary, skills, experience, education })
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
    }
}

module.exports = new ResumeController(); 