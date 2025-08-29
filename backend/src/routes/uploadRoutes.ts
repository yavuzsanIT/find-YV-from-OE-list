import express from 'express';
import multer from 'multer';
import path from 'path';
import uploadController from '../controllers/uploadController';

const router = express.Router();

const upload = multer({
  dest: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post('/upload', upload.single('file'), uploadController.handleUpload);
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(process.env.OUTPUT_DIR || 'outputs', filename);
  res.download(filePath, filename, err => {
    if (err) {
      res.status(404).json({ error: 'File not found' });
    }
  });
});

export default router;
