"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMoreThan_X = removeMoreThan_X;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
/**
 * Belirtilen dizindeki dosyaların son X tanesini siler.
 *Dosyalar en eski olandan en yeni olana göre sıralanır.
 * @param filePath - Dosyaların bulunduğu dizin
 * @param X - Silinecek dosya sayısı
 */
async function removeMoreThan_X(filePath, X) {
    try {
        const files = await promises_1.default.readdir(filePath);
        const filesWithStats = await Promise.all(files.map(async (file) => ({
            file,
            mtime: (await promises_1.default.stat(path_1.default.join(filePath, file))).mtime.getTime()
        })));
        const filesToDelete = filesWithStats
            .sort((a, b) => a.mtime - b.mtime)
            .slice(0, Math.max(0, files.length - X))
            .map(item => item.file);
        await Promise.all(filesToDelete.map(file => promises_1.default.unlink(path_1.default.join(filePath, file))));
    }
    catch (error) {
        console.error("Dosya silme hatası:", error);
        throw error;
    }
}
