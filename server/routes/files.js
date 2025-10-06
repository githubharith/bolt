import express from 'express';
import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth.js';
import File from '../models/File.js';
import Link from '../models/Link.js';

const router = express.Router();

// GridFS setup
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now - add restrictions as needed
    cb(null, true);
  }
});

// Upload file
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { customFilename } = req.body;
    if (!customFilename) {
      return res.status(400).json({
        success: false,
        message: 'Custom filename is required'
      });
    }

    // Check if custom filename already exists for this user
    const existingFile = await File.findOne({
      customFilename,
      uploadedBy: req.user._id,
      isActive: true
    });

    if (existingFile) {
      return res.status(400).json({
        success: false,
        message: 'A file with this custom name already exists'
      });
    }

    // Create GridFS upload stream
    const uploadStream = gfsBucket.openUploadStream(customFilename, {
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user._id,
        mimetype: req.file.mimetype
      }
    });

    // Upload the file buffer
    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', async () => {
      try {
        // Save file metadata to database
        const file = new File({
          customFilename,
          originalFilename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          uploadedBy: req.user._id,
          gridfsId: uploadStream.id
        });

        await file.save();
        await req.user.addActivityLog('file_upload', `Uploaded: ${customFilename}`, req);

        res.status(201).json({
          success: true,
          message: 'File uploaded successfully',
          file: {
            id: file._id,
            customFilename: file.customFilename,
            originalFilename: file.originalFilename,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: file.createdAt
          }
        });
      } catch (error) {
        console.error('File save error:', error);
        res.status(500).json({
          success: false,
          message: 'Error saving file metadata'
        });
      }
    });

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Error uploading file'
      });
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file upload'
    });
  }
});

// Get user's files
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      favorite = false,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      uploadedBy: req.user._id,
      isActive: true
    };

    if (search) {
      query.$or = [
        { customFilename: { $regex: search, $options: 'i' } },
        { originalFilename: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (favorite === 'true') {
      query.favorite = true;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const files = await File.find(query)
      .populate('uploadedBy', 'username email')
      .populate('linksCount')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      files,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching files'
    });
  }
});

// Get recent files (for home dashboard)
router.get('/recent', authenticate, async (req, res) => {
  try {
    const files = await File.find({
      uploadedBy: req.user._id,
      isActive: true
    })
    .populate('uploadedBy', 'username email')
    .sort({ favorite: -1, createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Get recent files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent files'
    });
  }
});

// View file in browser
router.get('/:id/view', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user has access to this file
    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create download stream from GridFS
    const downloadStream = gfsBucket.openDownloadStream(file.gridfsId);

    downloadStream.on('error', (error) => {
      console.error('View stream error:', error);
      res.status(404).json({
        success: false,
        message: 'File not found in storage'
      });
    });

    // Set headers for file view
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `inline; filename="${file.originalFilename}"`
    });

    // Pipe the file to response
    downloadStream.pipe(res);

  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file view'
    });
  }
});

// Download file
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user has access to this file
    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create download stream from GridFS
    const downloadStream = gfsBucket.openDownloadStream(file.gridfsId);

    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      res.status(404).json({
        success: false,
        message: 'File not found in storage'
      });
    });

    // Set headers for file download
    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.originalFilename}"`
    });

    // Increment download count
    file.downloadCount += 1;
    await file.save();

    // Pipe the file to response
    downloadStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during file download'
    });
  }
});

// Toggle favorite
router.patch('/:id/favorite', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
      isActive: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    file.favorite = !file.favorite;
    await file.save();

    res.json({
      success: true,
      message: `File ${file.favorite ? 'added to' : 'removed from'} favorites`,
      file
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating favorite status'
    });
  }
});

// Delete file and all its links
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check permissions
    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete from GridFS
    try {
      await gfsBucket.delete(file.gridfsId);
    } catch (gridError) {
      console.warn('GridFS delete warning:', gridError.message);
    }

    // Soft delete file record
    file.isActive = false;
    await file.save();

    // Deactivate all associated links
    await Link.updateMany(
      { file: file._id },
      { isActive: false }
    );

    await req.user.addActivityLog('file_delete', `Deleted: ${file.customFilename}`, req);

    res.json({
      success: true,
      message: 'File and associated links deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting file'
    });
  }
});

// Get all files (superuser only)
router.get('/admin/all', authenticate, authorize('superuser'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { customFilename: { $regex: search, $options: 'i' } },
        { originalFilename: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const files = await File.find(query)
      .populate('uploadedBy', 'username email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await File.countDocuments(query);

    res.json({
      success: true,
      files,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin get files error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching files'
    });
  }
});

export default router;