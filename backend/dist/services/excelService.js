"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processExcel = processExcel;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const xlsx_1 = __importDefault(require("xlsx"));
const helpers_1 = require("../utils/helpers");
const RemoverService_1 = require("./RemoverService");
/**
 * Kullanıcı tarafından yüklenen Excel dosyasındaki OE numaralarını,
 * kaynak havuz dosyasında arar ve eşleşen YV-OE çiftlerini yeni bir Excel dosyasına yazar.
 * @param queryFilePath - Kullanıcının yüklediği dosyanın geçici yolu.
 * @param keywordList - Arama yapılacak sütun başlığındaki kelime.
 * @param searchKeywords - Aranacak değerlerin dizisi.
 * @returns Oluşturulan sonuç dosyasının adı.
 */
async function processExcel(queryFilePath, keywordList, originalFilename) {
    try {
        // 1. Kaynak dosyasını oku 
        const OE_YV_MAP = (0, helpers_1.getOE_YV_Map)();
        // 2. Kullanıcının sorgu dosyasını @keywordList ile oku
        const query_OE_set = getQuerySet(excelToJson(queryFilePath, "Sayfa1"), keywordList);
        // 3. OE numaralarını bulma
        const found = findOENumbers(OE_YV_MAP, query_OE_set);
        // Eğer hiçbir eşleşme bulunamazsa 
        if (found.size === 0) {
            throw new Error("Belirtilen kriterlere uygun sonuç bulunamadı.");
        }
        // 4. Sonuçları Excel'e dönüştürme ve kaydetme
        // Sonuç dosya dı oluştur
        const fileExtension = path_1.default.extname(originalFilename);
        const baseName = path_1.default.basename(originalFilename, fileExtension);
        const newFilename = `${baseName}_Found_YV_Codes_${(0, helpers_1.getDateTimeAsText)()}${fileExtension}`;
        // Sonuç dosyasının yolunu oluştur
        const destDir = path_1.default.resolve(process.env.OUTPUT_DIR || 'outputs');
        const sourceDir = path_1.default.resolve(process.env.UPLOAD_DIR || '../../uploads');
        // Kaynak-Sonuç dosya klasörlerinin varlığını garantile
        await promises_1.default.mkdir(destDir, { recursive: true });
        await promises_1.default.mkdir(sourceDir, { recursive: true });
        const destPath = path_1.default.join(destDir, newFilename);
        // Bulunanları Excel dosyasına yaz
        mapToExcel(found, destPath);
        // Kullanıcının sorgu dosya yolunu sil
        await promises_1.default.unlink(queryFilePath);
        // Sadece son X dosyayı sakla
        await (0, RemoverService_1.removeMoreThan_X)(destDir, 5);
        await (0, RemoverService_1.removeMoreThan_X)(sourceDir, 3);
        return newFilename;
    }
    catch (error) {
        console.error("Excel işleme hatası:", error);
        throw error; // Hatanın dış katmana fırlatılmasını sağlıyoruz
    }
}
function excelToJson(inputFilePath, sheetName) {
    const wb = xlsx_1.default.readFile(inputFilePath, { cellDates: true });
    const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];
    if (!ws) {
        throw new Error(`Sayfa bulunamadı: ${sheetName}`);
    }
    const jsonData = xlsx_1.default.utils.sheet_to_json(ws, { raw: false });
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
function getQuerySet(jsonData, keywordList) {
    const oe_set = new Set();
    if (jsonData.length === 0) {
        console.warn(`Query Excel'de veri bulunamadı.`);
        return oe_set;
    }
    const headers = new Set;
    jsonData.forEach((item) => {
        Object.keys(item).forEach((key) => {
            headers.add(key);
        });
    });
    const relevantHeaders = keywordList.flatMap(kw => {
        return Array.from(headers).filter(header => header.toLowerCase().includes(kw.toLowerCase()));
    });
    if (relevantHeaders.length === 0) {
        throw new Error(`Dosyanızda '${keywordList}' kelimesini içeren bir sütun başlığı bulunamadı. Lütfen kontrol edin.`);
    }
    jsonData.forEach((item) => {
        relevantHeaders.forEach(relevantHeader => {
            const value = item[relevantHeader];
            if (value) {
                const normalizedValue = (0, helpers_1.normalizeText)(value.toString().trim());
                if (normalizedValue) {
                    oe_set.add(normalizedValue);
                }
            }
        });
    });
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
function findOENumbers(POOL_MAP, QUERY_SET) {
    const foundMap = new Map();
    QUERY_SET.forEach(query_oe => {
        const found_YV_array = POOL_MAP.get(query_oe);
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
function mapToExcel(resultMap, outputFilePath) {
    const rowData = [];
    for (const [oe, yvArray] of resultMap.entries()) {
        const row = { OE: oe };
        let index = 1;
        for (const yv of yvArray) {
            row[`YV_${index}`] = yv;
            index++;
        }
        rowData.push(row);
    }
    const ws = xlsx_1.default.utils.json_to_sheet(rowData);
    const wb = xlsx_1.default.utils.book_new();
    xlsx_1.default.utils.book_append_sheet(wb, ws, "Found OE Numbers");
    xlsx_1.default.writeFile(wb, outputFilePath);
}
exports.default = { processExcel };
