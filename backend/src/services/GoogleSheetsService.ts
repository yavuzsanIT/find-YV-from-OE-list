import dotenv from 'dotenv';
import path from "path";

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const sheet = process.env.VITE_GOOGLE_SHEETS_API_URL || "https://opensheet.elk.sh";
const sheetId = process.env.VITE_GOOGLE_SHEETS_ID || "1z2iVFbFLiAm4k5a-9eWYz_LERXCqnLKOFwZcYwooHzg";
const sheetName = process.env.VITE_GOOGLE_SHEETS_SHEET_NAME || "Sheet1";

export async function fetchSheetData() {
    const url = `${sheet}/${sheetId}/${sheetName}`;
    const response = await fetch(url);
    const data = await response.json();
    //console.log(data)
    return data;
}

export async function get_OE_YV_MAP(): Promise<Map<string, string[]>> {

    const OE_YV_set = new Map<string, Set<string>>();

    const sourceData = await fetchSheetData();

    sourceData.forEach((item: any) => {
        const oe = item["orjNo"];
        const yv = item["yvNo"];

        if (oe && yv) {
            if (OE_YV_set.has(oe)) {
                OE_YV_set.get(oe)?.add(yv);
            } else {
                OE_YV_set.set(oe, new Set([yv]));
            }
        }
    })

    const result = new Map<string, string[]>();

    OE_YV_set.forEach((yvSet, oeKey) => {
        result.set(oeKey, Array.from(yvSet));
    });

    return result;
}


//fetchSheetData();