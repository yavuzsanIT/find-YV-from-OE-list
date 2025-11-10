"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchSheetData = fetchSheetData;
exports.get_OE_YV_MAP = get_OE_YV_MAP;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
const sheet = process.env.GOOGLE_SHEETS_API_URL;
const sheetId = process.env.GOOGLE_SHEETS_ID;
const sheetName = process.env.GOOGLE_SHEETS_SHEET_NAME;
async function fetchSheetData() {
    const url = `${sheet}/${sheetId}/${sheetName}`;
    const response = await fetch(url);
    const data = await response.json();
    //console.log(data)
    return data;
}
async function get_OE_YV_MAP() {
    const OE_YV_set = new Map();
    const sourceData = await fetchSheetData();
    sourceData.forEach((item) => {
        const oe = item["orjNo"];
        const yv = item["yvNo"];
        if (oe && yv) {
            if (OE_YV_set.has(oe)) {
                OE_YV_set.get(oe)?.add(yv);
            }
            else {
                OE_YV_set.set(oe, new Set([yv]));
            }
        }
    });
    const result = new Map();
    OE_YV_set.forEach((yvSet, oeKey) => {
        result.set(oeKey, Array.from(yvSet));
    });
    return result;
}
//fetchSheetData();
