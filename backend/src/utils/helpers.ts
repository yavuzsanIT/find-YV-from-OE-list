import OE_YV_DATA from '../../data/ORJ_NO.json';

interface OeYvMapping {
    OE: string;
    YV: string[];
}

/**
 * Returns a Map of OE number to YV numbers. The keys are the OE numbers and the
 * values are arrays of YV numbers that match the OE number.
 *
 * @returns A Map of OE to YV numbers.
 */

export function getOE_YV_Map(): Map<string, string[]> {
    const OE_YV_MAP: Map<string, string[]> = new Map();

    OE_YV_DATA.forEach((item: OeYvMapping) => {
        OE_YV_MAP.set(item.OE, item.YV);
    });

    return OE_YV_MAP;
}

export function normalizeText(text: string) {
    return text.replace(/[^a-zA-Z0-9]/g, '');
}


export function getDateTimeAsText() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}