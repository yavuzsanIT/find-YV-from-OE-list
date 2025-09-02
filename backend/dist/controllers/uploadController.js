"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const excelService_1 = __importDefault(require("../services/excelService"));
const handleUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi.' });
        }
        const { keywords } = req.body;
        if (!keywords || keywords.trim() === '') {
            return res.status(400).json({ error: 'Arama kelimeleri eksik.' });
        }
        const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length >= 2);
        const uploadedPath = req.file.path;
        const originalFilename = req.file.originalname;
        const newFilename = await excelService_1.default.processExcel(uploadedPath, keywordList, originalFilename);
        res.json({ filename: newFilename });
    }
    catch (error) {
        console.error("Yükleme kontrolcüsü hatası:", error);
        res.status(500).json({ error: error.message || 'Dosya işlenirken bir hata oluştu.' });
    }
};
exports.default = { handleUpload };
