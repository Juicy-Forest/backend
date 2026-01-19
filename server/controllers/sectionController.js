const sectionController = require('express').Router();

const {
    getSectionsByGarden,
    getSectionById,
    createSection,
    updateSection,
    deleteSection
} = require('../services/sectionService');

sectionController.get('/:gardenId', async (req, res) => {
    try {
        const sections = await getSectionsByGarden(req.params.gardenId);
        res.status(200).json(sections);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error getting garden sections' });
    }
});

sectionController.get('/:sectionId', async (req, res) => {
    try {
        const section = await getSectionById(req.params.sectionId);
        if (!section) {
            return res.status(404).json({ error: 'Not found.' });
        }

        res.status(200).json(section);
    } catch (error) {
        res.status(500).json({ error: 'Error getting section' });
    }
});

sectionController.post('/:gardenId', async (req, res) => {
    try {
        const data = {
            ...req.body,
            garden: req.params.gardenId,
        };
        const created = await createSection(data);
        res.status(201).json(created);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
});

sectionController.put('/:sectionId', async (req, res) => {
    try {
        const updated = await updateSection(req.params.sectionId, req.body);

        if (!updated) {
            return res.status(404).json({ error: 'Section not found' });
        }

        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

sectionController.delete('/:sectionId', async (req, res) => {
    try {
        const deleted = await deleteSection(req.params.sectionId);

        if (!deleted) {
            return res.status(404).json({ error: 'Section not found' });
        }

        res.status(200).json({ message: 'Deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error removing section' });
    }
});

module.exports = sectionController;
