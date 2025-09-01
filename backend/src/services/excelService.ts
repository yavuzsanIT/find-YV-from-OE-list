import fs from 'fs/promises';
import path from 'path';
import xlsx from 'xlsx';
import { normalizeText } from '../utils/helpers';
import { removeMoreThan_X } from './RemoverService';

const POOL_FILE_PATH = path.resolve(__dirname, '../../data/ORJ_NO.xlsx');

/**
 * Kullanıcı tarafından yüklenen Excel dosyasındaki OE numaralarını, 
 * kaynak havuz dosyasında arar ve eşleşen YV-OE çiftlerini yeni bir Excel dosyasına yazar.
 * @param queryFilePath - Kullanıcının yüklediği dosyanın geçici yolu.
 * @param keywordList - Arama yapılacak sütun başlığındaki kelime.
 * @param searchKeywords - Aranacak değerlerin dizisi.
 * @returns Oluşturulan sonuç dosyasının adı.
 */
export async function processExcel(
    queryFilePath: string,
    keywordList: string[]
): Promise<string> {
    try {
        // 1. Kaynak havuz dosyasını oku ve işleme. hasYVColumn: true
        const full_oe_pool_map = getSourceMap(excelToJson(POOL_FILE_PATH, "NORMALIZED_OE_NUMBERS"));

        // 2. Kullanıcının sorgu dosyasını oku ve işleme. hasYVColumn: false
        const query_OE_set = getQuerySet(excelToJson(queryFilePath, "Sayfa1"), keywordList);

        // 3. OE numaralarını bulma
        const found = findOENumbers(full_oe_pool_map, query_OE_set);

        // Eğer hiçbir eşleşme bulunamazsa 
        if (found.size === 0) {
            // Sonuç dosyasını boş oluşturmak yerine hata fırlatabiliriz.
            throw new Error("Belirtilen kriterlere uygun sonuç bulunamadı.");
        }

        // 4. Sonuçları Excel'e dönüştürme ve kaydetme
        const newFilename = `results_${Date.now()}.xlsx`;
        const destDir = path.resolve(process.env.OUTPUT_DIR || 'outputs');
        const sourceDir = path.resolve(process.env.UPLOAD_DIR || '../../uploads');
        const destPath = path.join(destDir, newFilename);

        // Bulunanları Excel dosyasına yaz
        mapToExcel(found, destPath);

        await fs.unlink(queryFilePath);

        // Sadece son 5 dosyayı sakla
        await removeMoreThan_X(destDir, 5);
        await removeMoreThan_X(sourceDir, 3);

        return newFilename;
    } catch (error) {
        console.error("Excel işleme hatası:", error);
        throw error; // Hatanın dış katmana fırlatılmasını sağlıyoruz
    }
}



function excelToJson(inputFilePath: string, sheetName: string): any[] {

    const wb = xlsx.readFile(inputFilePath, { cellDates: true });
    const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];

    if (!ws) {
        throw new Error(`Sayfa bulunamadı: ${sheetName}`);
    }

    const jsonData: any[] = xlsx.utils.sheet_to_json(ws, { raw: false });
    return jsonData;
}

function getSourceMap(jsonData: any[]): Map<string, Set<string>> {
    const oe_map = new Map<string, Set<string>>();

    if (jsonData.length === 0) {
        console.warn(`Source Excel'de veri bulunamadı.`);
        return oe_map;
    }

    jsonData.forEach((item: any) => {
        const oe = item["OE"];
        const yv = item["YV"];

        if (oe && yv) {
            if (oe_map.has(oe)) {
                oe_map.get(oe)?.add(yv);
            } else {
                oe_map.set(oe, new Set([yv]));
            }
        }
    })

    return oe_map;
}

/**
 * Given a JSON array of data from an Excel file and a search column keyword,
 * returns a Set of strings that are the values of the column that match the
 * search column keyword.
 *
 * If the search column keyword is not found in the Excel file's header, an
 * error is thrown.
 *
 * The function trims and normalizes the values before adding them to the Set.
 * If the normalized value is empty, it is not added to the Set.
 *
 * @param jsonData - The JSON array of data from the Excel file.
 * @param keywordList - The search column keyword to look for in the
 *   Excel file's header.
 * @returns A Set of strings that are the values of the column that match the
 *   search column keyword.
 */
function getQuerySet(jsonData: any[], keywordList: string[]): Set<string> {
    const oe_set: Set<string> = new Set();

    if (jsonData.length === 0) {
        console.warn(`Query Excel'de veri bulunamadı.`);
        return oe_set;
    }

    const headers = Object.keys(jsonData[0]);
    const relevantHeaders = keywordList.flatMap(kw => {
        return headers.filter(header => header.toLowerCase().includes(kw.toLowerCase()));
    })
    if (relevantHeaders.length === 0) {
        throw new Error(`Dosyanızda '${keywordList}' kelimesini içeren bir sütun başlığı bulunamadı. Lütfen kontrol edin.`);
    }

    jsonData.forEach((item: any) => {
        relevantHeaders.forEach(relevantHeader => {
            const value = item[relevantHeader];
            if (value) {
                const normalizedValue = normalizeText(value.toString().trim());
                if (normalizedValue) {
                    oe_set.add(normalizedValue);
                }
            }
        })
    })

    return oe_set;
}





/**
 * Given a pool map and a query set of OE numbers, find the YV numbers
 * that match the OE numbers in the query set. The result is a map
 * where each key is an OE number and the value is a set of YV numbers
 * that match the OE number.
 *
 * @param pool_map - A map where the keys are OE numbers and the values
 *   are sets of YV numbers that match the OE number.
 * @param query_set - A set of OE numbers to search for in the pool map.
 * @param searchKeywords - Array of search keywords. Not used in this function.
 * @returns - A map where each key is an OE number and the value is a set
 *   of YV numbers that match the OE number.
 */
function findOENumbers(pool_map: Map<string, Set<string>>, query_set: Set<string>): Map<string, Set<string>> {
    const foundMap: Map<string, Set<string>> = new Map();


    query_set.forEach(query_oe => {

        const found = pool_map.get(query_oe);
        if (found) {
            const existing = foundMap.get(query_oe);
            if (existing !== undefined) {
                found.forEach(yv => existing.add(yv));
            } else {
                foundMap.set(query_oe, new Set(found));
            }
        }
    });

    return foundMap;
}



/**
 * Writes the given result map to an Excel file at the given output file path.
 * The Excel file will contain a single worksheet named "Found OE Numbers".
 * Each row of the worksheet will contain an OE number and its corresponding
 * YV numbers. The YV numbers will be in columns named YV_1, YV_2, etc.
 * @param resultMap - A map where the keys are OE numbers and the values are
 *   sets of YV numbers that match the OE number.
 * @param outputFilePath - The path to write the Excel file to.
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