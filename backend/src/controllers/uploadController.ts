import { Request, Response } from 'express';
import excelService from '../services/excelService';

const handleUpload = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }
    
    const { keywords } = req.body as { keywords: string };
    // searchColumn artık frontend'den gelmiyor, sabit bir değer kullanıyoruz.
    const searchColumn = 'OE';

    if (!keywords || keywords.trim() === '') {
      return res.status(400).json({ error: 'Arama kelimeleri eksik.' });
    }

    const keywordList = keywords.split(',');

    const uploadedPath = req.file.path;

    const newFilename = await excelService.processExcel(uploadedPath, searchColumn, keywordList);

    res.json({ filename: newFilename });
  } catch (error: any) {
    console.error("Yükleme kontrolcüsü hatası:", error);
    res.status(500).json({ error: error.message || 'Dosya işlenirken bir hata oluştu.' });
  }
};

export default { handleUpload };