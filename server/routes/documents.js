const express = require('express');
const router = express.Router();
const documentService = require('../services/documentService');
const upload = require('../middleware/upload');

// Upload document
router.post('/upload', upload.single('document'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { vehicle_id, category, title, description, document_date, cost, vendor } = req.body;
    
    if (!vehicle_id || !category || !title) {
      return res.status(400).json({ error: 'vehicle_id, category, and title are required' });
    }
    
    // Save file to proper location
    const fileInfo = documentService.saveFile(vehicle_id, category, req.file);
    
    // Create document record
    const documentData = {
      vehicle_id: parseInt(vehicle_id),
      category,
      title,
      description: description || null,
      file_name: fileInfo.fileName,
      file_path: fileInfo.filePath,
      file_size: fileInfo.fileSize,
      file_type: fileInfo.fileType,
      uploaded_by: req.body.uploaded_by || 'System',
      document_date: document_date || null,
      cost: cost ? parseFloat(cost) : null,
      vendor: vendor || null,
      tags: req.body.tags || null,
      metadata: req.body.metadata || null
    };
    
    const document = documentService.createDocument(documentData);
    
    res.status(201).json(document);
  } catch (error) {
    next(error);
  }
});

// Get document by ID
router.get('/:id', (req, res, next) => {
  try {
    const document = documentService.getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Download document
router.get('/:id/download', (req, res, next) => {
  try {
    const fileInfo = documentService.getDocumentPath(req.params.id);
    if (!fileInfo) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.download(fileInfo.path, fileInfo.fileName);
  } catch (error) {
    next(error);
  }
});

// Update document metadata
router.put('/:id', (req, res, next) => {
  try {
    const document = documentService.updateDocument(req.params.id, req.body);
    res.json(document);
  } catch (error) {
    next(error);
  }
});

// Delete document
router.delete('/:id', (req, res, next) => {
  try {
    const success = documentService.deleteDocument(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all documents for a vehicle
router.get('/vehicle/:vehicleId', (req, res, next) => {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      sortBy: req.query.sortBy || 'upload_date',
      order: req.query.order || 'DESC'
    };
    
    const documents = documentService.getVehicleDocuments(req.params.vehicleId, filters);
    res.json(documents);
  } catch (error) {
    next(error);
  }
});

// Get document stats for a vehicle
router.get('/vehicle/:vehicleId/stats', (req, res, next) => {
  try {
    const stats = documentService.getVehicleDocumentStats(req.params.vehicleId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

