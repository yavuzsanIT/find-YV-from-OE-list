import { Request, Response } from 'express';
import excelService from '../services/excelService';

const handleUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }
    
    const { keywords } = req.body as { keywords: string };

    if (!keywords || keywords.trim() === '') {
      return res.status(400).json({ error: 'Arama kelimeleri eksik.' });
    }

    const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length >= 2);

    const uploadedPath = req.file.path;

    const originalFilename = req.file.originalname;

    const newFilename = await excelService.processExcel(uploadedPath, keywordList, originalFilename);

    res.json({ filename: newFilename });
  } catch (error: any) {
    console.error("Yükleme kontrolcüsü hatası:", error);
    res.status(500).json({ error: error.message || 'Dosya işlenirken bir hata oluştu.' });
  }
};

export default { handleUpload };