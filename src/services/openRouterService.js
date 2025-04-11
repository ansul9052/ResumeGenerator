const fetch = require('node-fetch');
const config = require('../config/config');

class OpenRouterService {
    constructor() {
        this.apiKey = config.openRouter.apiKey;
        this.apiUrl = config.openRouter.apiUrl;
    }

    async generateContent(prompt, temperature = 0.7) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
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

    async analyzeJobMatch(resume, jobDescription) {
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

        return await this.generateContent(prompt, 0.8);
    }

    async generateLinkedInSummary(resumeData) {
        const prompt = `Create a professional LinkedIn summary based on the following resume information:
${JSON.stringify(resumeData)}

The summary should be:
1. Engaging and professional
2. Highlight key achievements
3. Include relevant keywords
4. Be optimized for LinkedIn's format`;

        return await this.generateContent(prompt, 0.7);
    }

    async suggestImprovements(resumeData, industry) {
        const template = config.industryTemplates[industry] || config.industryTemplates.tech;
        const prompt = `Based on this resume for the ${industry} industry:
${JSON.stringify(resumeData)}

Suggest improvements including:
1. Industry-specific keywords to add
2. Relevant certifications to pursue
3. Skills that are trending in ${industry}
4. Format and structure improvements`;

        return await this.generateContent(prompt, 0.8);
    }
}

module.exports = new OpenRouterService(); 