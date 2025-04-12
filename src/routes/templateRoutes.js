const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const auth = require('../middleware/auth');

// Template data
const templates = [
    {
        id: 'template1',
        name: 'Professional Classic',
        description: 'Clean and professional template perfect for corporate positions',
        atsScore: 95,
        category: 'professional',
        filePath: 'templates/professional-classic.docx'
    },
    {
        id: 'template2',
        name: 'Creative Modern',
        description: 'Modern design with creative elements for creative industries',
        atsScore: 92,
        category: 'creative',
        filePath: 'templates/creative-modern.docx'
    },
    {
        id: 'template3',
        name: 'Technical Expert',
        description: 'Structured layout ideal for technical and engineering roles',
        atsScore: 94,
        category: 'technical',
        filePath: 'templates/technical-expert.docx'
    }
    // Add more templates here
];

// Get all templates
router.get('/', auth, async (req, res) => {
    try {
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Get template by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const template = templates.find(t => t.id === req.params.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// Download template
router.get('/:id/download', auth, async (req, res) => {
    try {
        const template = templates.find(t => t.id === req.params.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const filePath = path.join(__dirname, '../../public', template.filePath);
        
        // Check if file exists
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({ error: 'Template file not found' });
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${template.id}.docx`);

        // Stream the file
        const fileStream = require('fs').createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading template:', error);
        res.status(500).json({ error: 'Failed to download template' });
    }
});

module.exports = router; 