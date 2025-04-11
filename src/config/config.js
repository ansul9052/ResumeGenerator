require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    openRouter: {
        apiKey: process.env.OPENROUTER_API_KEY,
        apiUrl: process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
    },
    industryTemplates: {
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
    }
}; 