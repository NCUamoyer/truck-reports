const express = require('express');
const router = express.Router();
const documentService = require('../services/documentService');

// Create note
router.post('/', (req, res, next) => {
  try {
    const { vehicle_id, note_type, title, content, created_by } = req.body;
    
    if (!vehicle_id || !note_type || !title || !content) {
      return res.status(400).json({ error: 'vehicle_id, note_type, title, and content are required' });
    }
    
    const note = documentService.createNote({
      vehicle_id: parseInt(vehicle_id),
      note_type,
      title,
      content,
      created_by: created_by || 'System'
    });
    
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// Get all notes for a vehicle
router.get('/vehicle/:vehicleId', (req, res, next) => {
  try {
    const filters = {
      noteType: req.query.noteType,
      sortBy: req.query.sortBy || 'created_at',
      order: req.query.order || 'DESC'
    };
    
    const notes = documentService.getVehicleNotes(req.params.vehicleId, filters);
    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// Get note by ID
router.get('/:id', (req, res, next) => {
  try {
    const note = documentService.getNoteById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    next(error);
  }
});

// Update note
router.put('/:id', (req, res, next) => {
  try {
    const note = documentService.updateNote(req.params.id, req.body);
    res.json(note);
  } catch (error) {
    next(error);
  }
});

// Delete note
router.delete('/:id', (req, res, next) => {
  try {
    const success = documentService.deleteNote(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

