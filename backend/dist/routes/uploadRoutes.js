"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uploadController_1 = __importDefault(require("../controllers/uploadController"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    dest: path_1.default.resolve(process.env.UPLOAD_DIR || 'uploads'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
router.post('/upload', upload.single('file'), uploadController_1.default.handleUpload);
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path_1.default.resolve(process.env.OUTPUT_DIR || 'outputs', filename);
    res.download(filePath, filename, err => {
        if (err) {
            res.status(404).json({ error: 'File not found' });
        }
    });
});
exports.default = router;
