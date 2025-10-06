"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOE_YV_Map = getOE_YV_Map;
exports.getDateTimeAsText = getDateTimeAsText;
exports.normalizeText = normalizeText;
const ORJ_NO_json_1 = __importDefault(require("../../data/ORJ_NO.json"));
/**
 * Returns a Map of OE number to YV numbers. The keys are the OE numbers and the
 * values are arrays of YV numbers that match the OE number.
 *
 * @returns A Map of OE to YV numbers.
 */
function getOE_YV_Map() {
    const OE_YV_MAP = new Map();
    ORJ_NO_json_1.default.forEach((item) => {
        OE_YV_MAP.set(item.OE, item.YV);
    });
    return OE_YV_MAP;
}
function getDateTimeAsText() {
    const now = new Date();
    return now.toISOString()
        .replace(/[:]/g, '-') // saat ayracındaki : yerine -
        .replace('T', '_') // tarih-saat arasındaki T yerine _
        .split('.')[0]; // milisaniyeyi at
}
function normalizeText(text) {
    // 1. Tüm Non-ASCII boşlukları (örn. \u00A0, \uFEFF) normal boşluğa (\u0020) çevir.
    // Bu, özellikle dış sistemlerden (Excel, FileMaker Pro vb.) gelen veriler için kritiktir.
    const cleanedText = text.normalize('NFKD').replace(/[\s\u0000-\u001F\u007F-\u009F\u00A0\uFEFF\u2000-\u200A\u202F\u205F\u3000]+/g, '');
    // 2. Geri kalan (kelime aralarındaki) özel karakterleri sil.
    // Tüm boşluklar zaten başında ve sonda silindi. Şimdi sadece ortadaki özel karakterler kaldı.
    return cleanedText.replace(/[^\w\s]/gu, '');
}
