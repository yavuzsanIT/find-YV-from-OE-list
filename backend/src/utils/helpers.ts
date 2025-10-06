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

export function getDateTimeAsText(): string {
    const now = new Date();
    return now.toISOString()
        .replace(/[:]/g, '-')  // saat ayracındaki : yerine -
        .replace('T', '_')     // tarih-saat arasındaki T yerine _
        .split('.')[0];        // milisaniyeyi at
}

export function normalizeText(text: string): string {
    // 1. Tüm Non-ASCII boşlukları (örn. \u00A0, \uFEFF) normal boşluğa (\u0020) çevir.
    // Bu, özellikle dış sistemlerden (Excel, FileMaker Pro vb.) gelen veriler için kritiktir.
    const cleanedText = text.normalize('NFKD').replace(/[\s\u0000-\u001F\u007F-\u009F\u00A0\uFEFF\u2000-\u200A\u202F\u205F\u3000]+/g, '');
    
    // 2. Geri kalan (kelime aralarındaki) özel karakterleri sil.
    // Tüm boşluklar zaten başında ve sonda silindi. Şimdi sadece ortadaki özel karakterler kaldı.
    return cleanedText.replace(/[^\w\s]/gu, '');
}