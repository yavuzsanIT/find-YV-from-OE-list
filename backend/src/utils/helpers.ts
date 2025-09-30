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


export function getDateTimeAsText(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[:]/g, '-')  // saat ayracındaki : yerine -
    .replace('T', '_')     // tarih-saat arasındaki T yerine _
    .split('.')[0];        // milisaniyeyi at
}
