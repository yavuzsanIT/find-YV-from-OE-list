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
    return !text ? "" : text.replace(/\\n|\\r|\\t/g, '').replace(/[^a-zA-Z0-9]/g, '');
}
