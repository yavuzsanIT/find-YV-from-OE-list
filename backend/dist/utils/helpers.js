"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOE_YV_Map = getOE_YV_Map;
exports.normalizeText = normalizeText;
exports.getDateTimeAsText = getDateTimeAsText;
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
function normalizeText(text) {
    return text.replace(/[^a-zA-Z0-9]/g, '');
}
function getDateTimeAsText() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
