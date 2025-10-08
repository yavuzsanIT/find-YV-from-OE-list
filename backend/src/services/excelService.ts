import fs from 'fs/promises';
import path from 'path';
import xlsx from 'xlsx';
import { getDateTimeAsText, getOE_YV_Map, normalizeText } from '../utils/helpers';
import { removeMoreThan_X } from './RemoverService';


/**
 * Kullanıcı tarafından yüklenen Excel dosyasındaki OE numaralarını, 
 * kaynak havuz dosyasında arar ve eşleşen YV-OE çiftlerini yeni bir Excel dosyasına yazar.
 * @param queryFilePath - Kullanıcının yüklediği dosyanın geçici yolu.
 * @param keywordList - Arama yapılacak sütun başlığındaki kelime.
 * @param searchKeywords - Aranacak değerlerin dizisi.
 * @returns Oluşturulan sonuç dosyasının adı.
 */
export async function processExcel(queryFilePath: string, keywordList: string[], originalFilename: string): Promise<string> {
    try {

        // 0. Kaynak dosyayı oku ve tut
        const sourceData = excelToJson(queryFilePath, "Sayfa1");
        const relevantHeaders = getRelevantHeaders(sourceData, keywordList);

        // 1. Kaynak dosyasını oku 
        const OE_YV_MAP = getOE_YV_Map();

        // 2. Kullanıcının sorgu dosyasını @keywordList ile oku
        const query_OE_set = getQuerySet(sourceData, keywordList);

        // 3. OE numaralarını bulma
        const found = findOENumbers(OE_YV_MAP, query_OE_set);

        // Eğer hiçbir eşleşme bulunamazsa 
        if (found.size === 0) {
            throw new Error("Belirtilen kriterlere uygun sonuç bulunamadı.");
        }


        // INFO: Gelen dosya üzerine bulunanları ekleme
        sourceData.map((row: any) => {
            relevantHeaders.forEach(rh => {
                const code = row[rh]; // örneğin OEM numarası

                if (code) { // Hata önleme: Boş/null kodu normalize etme
                    

                    if (code && query_OE_set.has(code)) { // Şimdi doğru anahtarla arama yap
                        // Not: foundMap'e atanmış anahtar normalizedCode değil, query_oe'ydi.
                        // Bu yüzden ya foundMap'i query_oe ile değil normalized OE ile dolduracağız (Daha temiz) 
                        // ya da burada code yerine query_oe'yi kullanacağız (Daha karmaşık).

                        // En temiz yol: findOENumbers'ı ve burayı normalize OE ile kullan
                        row["Found_YV_Codes"] = found.get(code)?.join(", ") || "";
                    }
                }
            })
        })

        // 4. Sonuçları Excel'e dönüştürme ve kaydetme

        // Sonuç dosya adı oluştur
        const fileExtension = path.extname(originalFilename);
        const baseName = path.basename(originalFilename, fileExtension);
        const newFilename = `${baseName}_Found_YV_Codes_${getDateTimeAsText()}${fileExtension}`;


        // Sonuç dosyasının yolunu oluştur
        const destDir = path.resolve(process.env.OUTPUT_DIR || 'outputs');
        const sourceDir = path.resolve(process.env.UPLOAD_DIR || '../../uploads');

        // Kaynak-Sonuç dosya klasörlerinin varlığını garantile
        await fs.mkdir(destDir, { recursive: true });
        await fs.mkdir(sourceDir, { recursive: true });

        const destPath = path.join(destDir, newFilename);

        // Bulunanları Excel dosyasına yaz
        //mapToExcel(found, destPath);

        const ws = xlsx.utils.json_to_sheet(sourceData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Updated Data");
        xlsx.writeFile(wb, destPath);


        // Kullanıcının sorgu dosya yolunu sil
        await fs.unlink(queryFilePath);

        // Sadece son X dosyayı sakla
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

    const relevantHeaders = getRelevantHeaders(jsonData, keywordList);

    jsonData.forEach((item: any) => {
        relevantHeaders.forEach(relevantHeader => {
            const value = item[relevantHeader];
            if (value) {
                oe_set.add(value.toString());
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
 * @param POOL_MAP - A map where the keys are OE numbers and the values
 *   are sets of YV numbers that match the OE number.
 * @param QUERY_SET - A set of OE numbers to search for in the pool map.
 * @param searchKeywords - Array of search keywords. Not used in this function.
 * @returns - A map where each key is an OE number and the value is a set
 *   of YV numbers that match the OE number.
 */
function findOENumbers(POOL_MAP: Map<string, string[]>, QUERY_SET: Set<string>): Map<string, string[]> {

    const foundMap: Map<string, string[]> = new Map();

    QUERY_SET.forEach(query_oe => {

        const found_YV_array = POOL_MAP.get(normalizeText(query_oe.trim()));
        if (found_YV_array) {
            foundMap.set(query_oe, found_YV_array);
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
function mapToExcel(resultMap: Map<string, string[]>, outputFilePath: string) {
    const rowData: any[] = [];

    for (const [oe, yvArray] of resultMap.entries()) {
        const row: any = { OE: oe };
        let index = 1;
        for (const yv of yvArray) {
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


function getRelevantHeaders(jsonData: any[], keywordList: string[]): string[] {
    const headers = new Set<string>;
    jsonData.forEach((item: any) => {
        Object.keys(item).forEach((key: string) => {
            headers.add(key);
        });
    })

    const relevantHeaders = keywordList.flatMap(kw => {
        return Array.from(headers).filter(header => header.toLowerCase().includes(kw.toLowerCase()));
    })

    if (relevantHeaders.length === 0) {
        throw new Error(`Dosyanızda '${keywordList}' kelimesini içeren bir sütun başlığı bulunamadı. Lütfen kontrol edin.`);
    }

    return relevantHeaders;
}

export default { processExcel };