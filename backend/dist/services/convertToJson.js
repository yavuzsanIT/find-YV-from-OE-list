"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const xlsx_1 = __importDefault(require("xlsx"));
function convertToJSonFromExcel(filePath, sheetName) {
    const wb = xlsx_1.default.readFile(path_1.default.resolve(__dirname, filePath), { cellDates: true });
    const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];
    const jsonData = xlsx_1.default.utils.sheet_to_json(ws, { raw: false });
    const YV_OE_map = new Map();
    if (jsonData.length === 0) {
        console.warn(`Excel'de veri bulunamadı.`);
        return YV_OE_map;
    }
    jsonData.forEach((item) => {
        const oe = item["OE"];
        const yv = item["YV"];
        if (oe && yv) {
            if (YV_OE_map.has(oe)) {
                YV_OE_map.get(oe)?.add(yv);
            }
            else {
                YV_OE_map.set(oe, new Set([yv]));
            }
        }
    });
    const yv_oe_records = [];
    YV_OE_map.forEach((yvSet, oeKey) => {
        yv_oe_records.push({ OE: oeKey, YV: Array.from(yvSet) });
    });
    promises_1.default.writeFile(path_1.default.join(__dirname, '../../data/ORJ_NO.json'), JSON.stringify(yv_oe_records, null, 2));
}
convertToJSonFromExcel('../../data/ORJ_NO_KATALOG.xlsx', 'Sheet1');
