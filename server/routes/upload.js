const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Function to get supabase client (will be called after env is loaded)
const getSupabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, GIF, WebP, and SVG files are allowed.'), false);
    }
  }
});

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }
  
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  
  req.user = user;
  next();
};

// POST /api/upload/logo - Upload subscription logo
router.post('/logo', authenticateUser, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { originalname, buffer, mimetype, size } = req.file;
    const userId = req.user.id;
    
    // Generate unique filename
    const fileExtension = originalname.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    
    const supabase = getSupabase();
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('subscription-logos')
      .upload(fileName, buffer, {
        contentType: mimetype,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Upload error:', error);
      return res.status(400).json({ error: 'Failed to upload file: ' + error.message });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('subscription-logos')
      .getPublicUrl(fileName);
    
    res.json({
      message: 'File uploaded successfully',
      fileName: fileName,
      publicUrl: publicUrl,
      fileSize: size,
      mimeType: mimetype
    });
    
  } catch (error) {
    console.error('Server error:', error);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
    }
    
    res.status(500).json({ error: error.message || 'Server error during file upload' });
  }
});

// DELETE /api/upload/logo/:fileName - Delete uploaded logo
router.delete('/logo/:fileName(*)', authenticateUser, async (req, res) => {
  try {
    const fileName = req.params.fileName;
    const userId = req.user.id;
    
    // Check if file belongs to user (fileName should start with userId)
    if (!fileName.startsWith(userId)) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own files.' });
    }
    
    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from('subscription-logos')
      .remove([fileName]);
    
    if (error) {
      return res.status(400).json({ error: 'Failed to delete file: ' + error.message });
    }
    
    res.json({ message: 'File deleted successfully', fileName });
    
  } catch (error) {
    res.status(500).json({ error: 'Server error during file deletion' });
  }
});

// GET /api/upload/logos - List user's uploaded logos
router.get('/logos', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from('subscription-logos')
      .list(userId, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      return res.status(400).json({ error: 'Failed to list files: ' + error.message });
    }
    
    // Add public URLs to each file
    const filesWithUrls = data.map(file => {
      const { data: { publicUrl } } = supabase.storage
        .from('subscription-logos')
        .getPublicUrl(`${userId}/${file.name}`);
      
      return {
        ...file,
        publicUrl,
        fullPath: `${userId}/${file.name}`
      };
    });
    
    res.json(filesWithUrls);
    
  } catch (error) {
    res.status(500).json({ error: 'Server error while listing files' });
  }
});

module.exports = router;
