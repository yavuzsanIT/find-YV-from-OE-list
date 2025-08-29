import { Request, Response } from 'express';
import excelService from '../services/excelService';

const handleUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const uploadedPath = req.file.path;
    const newFilename = await excelService.processExcel(uploadedPath);
    res.json({ filename: newFilename });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process file' });
  }
};

export default { handleUpload };
