import path from 'path';
import fs from 'fs/promises';

/**
 * Belirtilen dizindeki dosyaların son X tanesini siler.
 *Dosyalar en eski olandan en yeni olana göre sıralanır.
 * @param filePath - Dosyaların bulunduğu dizin
 * @param X - Silinecek dosya sayısı
 */
export async function removeMoreThan_X(filePath: string, X: number): Promise<void> {
    try {
        const files = await fs.readdir(filePath);
       
        
        const filesWithStats = await Promise.all(
            files.map(async file => ({
                file,
                mtime: (await fs.stat(path.join(filePath, file))).mtime.getTime()
            }))
        );

        const filesToDelete = filesWithStats
            .sort((a, b) => a.mtime - b.mtime)
            .slice(0, Math.max(0, files.length - X))
            .map(item => item.file);

        await Promise.all(filesToDelete.map(file => fs.unlink(path.join(filePath, file))));

    } catch (error) {
        console.error("Dosya silme hatası:", error);
        throw error;
    }
}
