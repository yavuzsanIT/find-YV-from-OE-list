import fs from 'fs/promises';
import path from 'path';
import xlsx from 'xlsx';
import { normalizeText } from '../utils/helpers';

const POOL_FILE_PATH = path.resolve(__dirname, '../../data/ORJ_NO.xlsx');

/**
 * Excel'deki verileri anahtar-değer çiftlerine dönüştürür.
 * @param inputFilePath - Excel dosya yolu.
 * @param sheetName - Sayfa adı.
 * @param searchColumnKeyword - Sütun başlığında aranacak anahtar kelime.
 * @param hasYVColumn - "YV" sütunu olup olmadığını belirtir.
 * @returns [Map<string, string[]>, Set<string>]
 */
function excelToObjects(inputFilePath: string, sheetName: string, searchColumnKeyword: string, hasYVColumn: boolean): [Map<string, string[]>, Set<string>] {
    const wb = xlsx.readFile(inputFilePath, { cellDates: true });
    const ws = wb.Sheets[sheetName];

    if (!ws) {
        throw new Error(`Sayfa bulunamadı: ${sheetName}`);
    }

    const jsonData: any[] = xlsx.utils.sheet_to_json(ws, { raw: false });
    const oe_map = new Map<string, string[]>();
    const oe_set: Set<string> = new Set();
    
    if (jsonData.length === 0) {
        console.warn(`Excel'de veri bulunamadı: ${inputFilePath}`);
        return [oe_map, oe_set];
    }

    const headers = Object.keys(jsonData[0]);
    const relevantKey = headers.find(key => key.toLowerCase().includes(searchColumnKeyword.toLowerCase()));

    if (!relevantKey) {
        throw new Error(`Dosyanızda '${searchColumnKeyword}' kelimesini içeren bir sütun başlığı bulunamadı. Lütfen kontrol edin.`);
    }

    jsonData.forEach(row => {
        const value = row[relevantKey];
        if (value) {
            const normalizedValue = normalizeText(value.toString().trim());
            if (normalizedValue) {
                if (hasYVColumn) {
                    const yv = row["YV"] || "";
                    if (yv) {
                        const existing = oe_map.get(normalizedValue);
                        if (existing) {
                            existing.push(yv);
                        } else {
                            oe_map.set(normalizedValue, [yv]);
                        }
                    }
                } else {
                    oe_set.add(normalizedValue);
                }
            }
        }
    });

    return [oe_map, oe_set];
}

/**
 * Sorgu OE numaralarını havuzdan bulur ve arama kelimelerine göre filtreler.
 * @param pool_map - Kaynak havuzunun Map'i. <OE-YV[]>
 * @param query_set - Sorgulanacak OE numaralarının Set'i.
 * @param searchKeywords - Aranacak kelimelerin dizisi.
 * @returns Bulunan YV-OE eşleşmelerinin Map'i.
 */
function findOENumbers(pool_map: Map<string, string[]>, query_set: Set<string>, searchKeywords: string[]): Map<string, Set<string>> {
    const found: Map<string, Set<string>> = new Map();
    const normalizedKeywords = searchKeywords.map(normalizeText);

    query_set.forEach(query_oe => {
        const existing = pool_map.get(query_oe);
        if (existing) {
            // Sadece OE numarasının, arama kelimelerinden herhangi birini içerip içermediğini kontrol et.
            if (normalizedKeywords.some(keyword => query_oe.includes(keyword))) {
                 if (!found.has(query_oe)) {
                    found.set(query_oe, new Set(existing));
                } else {
                    const set = found.get(query_oe);
                    if (set) {
                        existing.forEach(item => set.add(item));
                    }
                }
            }
        }
    });

    return found;
}

/**
 * Kullanıcı tarafından yüklenen Excel dosyasındaki OE numaralarını, 
 * kaynak havuz dosyasında arar ve eşleşen YV-OE çiftlerini yeni bir Excel dosyasına yazar.
 * @param queryFilePath - Kullanıcının yüklediği dosyanın geçici yolu.
 * @param searchColumnKeyword - Arama yapılacak sütun başlığındaki kelime.
 * @param searchKeywords - Aranacak değerlerin dizisi.
 * @returns Oluşturulan sonuç dosyasının adı.
 */
export async function processExcel(
    queryFilePath: string, 
    searchColumnKeyword: string,
    searchKeywords: string[]
): Promise<string> {
    try {
        // 1. Kaynak havuz dosyasını oku ve işleme. hasYVColumn: true
        const [full_oe_pool_map] = excelToObjects(POOL_FILE_PATH, "NORMALIZED_OE_NUMBERS", "OE", true);

        // 2. Kullanıcının sorgu dosyasını oku ve işleme. hasYVColumn: false
        const [, query_OE_set] = excelToObjects(queryFilePath, "Sayfa1", searchColumnKeyword, false);

        // 3. OE numaralarını bulma
        const found = findOENumbers(full_oe_pool_map, query_OE_set, searchKeywords);
        
        // Eğer hiçbir eşleşme bulunamazsa
        if (found.size === 0) {
            // Sonuç dosyasını boş oluşturmak yerine hata fırlatabiliriz.
            throw new Error("Belirtilen kriterlere uygun sonuç bulunamadı.");
        }

        // 4. Sonuçları Excel'e dönüştürme ve kaydetme
        const newFilename = `results_${Date.now()}.xlsx`;
        const destPath = path.join(path.resolve(process.env.OUTPUT_DIR || 'outputs'), newFilename);
        mapToExcel(found, destPath);

        await fs.unlink(queryFilePath);

        return newFilename;
    } catch (error) {
        console.error("Excel işleme hatası:", error);
        throw error; // Hatanın dış katmana fırlatılmasını sağlıyoruz
    }
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