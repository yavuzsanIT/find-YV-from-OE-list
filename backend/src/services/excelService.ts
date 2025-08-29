import fs from 'fs/promises';
import path from 'path';
import xlsx from 'xlsx';
import { normalizeText } from '../utils/helpers';

// Sabit pool dosyasının yolu. Bu dosyayı projenizin 'data' klasörüne taşıyın.
const POOL_FILE_PATH = path.resolve(__dirname, '../../data/ORJ_NO.xlsx');

/**
 * Kullanıcı tarafından yüklenen Excel dosyasındaki OE numaralarını, 
 * kaynak havuz dosyasında arar ve eşleşen YV-OE çiftlerini yeni bir Excel dosyasına yazar.
 * @param queryFilePath - Kullanıcının yüklediği dosyanın geçici yolu.
 * @returns Oluşturulan sonuç dosyasının yolu.
 */
export async function processExcel(queryFilePath: string): Promise<string> {
    try {
        // 1. Kaynak havuz dosyasını oku ve işleme
        const [full_oe_pool_map] = excelToObjects(POOL_FILE_PATH, "NORMALIZED_OE_NUMBERS");

        // 2. Kullanıcının sorgu dosyasını oku ve işleme
        const [, query_OE_set] = excelToObjects(queryFilePath, "Sayfa1");

        // 3. OE numaralarını bulma
        const found = findOENumbers(full_oe_pool_map, query_OE_set);

        // 4. Sonuçları Excel'e dönüştürme ve kaydetme
        const newFilename = `results_${Date.now()}.xlsx`;
        const destPath = path.join(path.resolve(process.env.OUTPUT_DIR || 'outputs'), newFilename);
        mapToExcel(found, destPath);

        // Kullanıcının yüklediği geçici dosyayı siliyoruz.
        await fs.unlink(queryFilePath);

        return newFilename;
    } catch (error) {
        console.error("Excel işleme hatası:", error);
        throw new Error("Dosya işlenirken bir hata oluştu.");
    }
}

/**
 * Excel dosyasındaki verileri işler ve Map ile Set'e dönüştürür.
 * @param inputFilePath - İşlenecek Excel dosyasının yolu.
 * @param sheetName - İşlenecek sayfanın adı.
 * @returns [<OE-YV[]> Map, OE Set]
 */
function excelToObjects(inputFilePath: string, sheetName: string): [Map<string, string[]>, Set<string>] {
    const wb = xlsx.readFile(inputFilePath, { cellDates: true });
    const ws = wb.Sheets[sheetName];

    const jsonData: any[] = xlsx.utils.sheet_to_json(ws);
    const oe_map = new Map<string, string[]>();
    const oe_set: Set<string> = new Set();

    jsonData.forEach(row => {
        const yv = row["YV"] || "";
        Object.keys(row).forEach(key => {
            if (key.includes("OE") && row[key]) {
                const oeValue = normalizeText(row[key].toString().trim());
                if (oeValue) {
                    const existing = oe_map.get(oeValue);
                    if (existing) {
                        existing.push(yv);
                    } else {
                        oe_map.set(oeValue, [yv]);
                    }
                }
                oe_set.add(oeValue);
            }
        });
    });

    return [oe_map, oe_set];
}

/**
 * Sorgu OE numaralarını havuzdan bulur.
 * @param pool_map - Kaynak havuzunun Map'i. <OE-YV[]>
 * @param query_set - Sorgulanacak OE numaralarının Set'i.
 * @returns Bulunan YV-OE eşleşmelerinin Map'i.
 */
function findOENumbers(pool_map: Map<string, string[]>, query_set: Set<string>): Map<string, Set<string>> {
   
    const found: Map<string, Set<string>> = new Map();

    query_set.forEach(query_oe => {

        if (!query_oe) {
            return;
        }

        const existing = pool_map.get(query_oe);
        if (existing) {
            if (!found.has(query_oe)) {
                found.set(query_oe, new Set(existing));
            } else {
                const set = found.get(query_oe);
                if (set) {
                    existing.forEach(item => set.add(item));
                }
            }
        }

    });

    return found;
}


/**
 * Sonuç Map'ini bir Excel dosyasına yazar.
 * @param resultMap - Yazılacak sonuç Map'i.
 * @param outputFilePath - Çıktı dosyasının yolu.
 */
function mapToExcel(resultMap: Map<string, Set<string>>, outputFilePath: string) {
    const rowData: any[] = [];

    for (const [oe, yvSet] of resultMap.entries()) {
        const row: any = { OE: oe };
        let index = 1;
        for (const yv of yvSet) {
            row[`YV_${index}`] = yv;
            index++;
        }
        rowData.push(row);
    }

    const ws = xlsx.utils.json_to_sheet(rowData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Found OE Numbers");
    xlsx.writeFile(wb, outputFilePath);
}

export default { processExcel };