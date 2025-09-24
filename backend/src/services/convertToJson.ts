import path from 'path';
import fs from 'fs/promises';
import xlsx from 'xlsx';

function convertToJSonFromExcel(filePath: string, sheetName: string) {

    const wb = xlsx.readFile(path.resolve(__dirname, filePath), { cellDates: true });
    const ws = wb.Sheets[sheetName] || wb.Sheets[wb.SheetNames[0]];

    const jsonData: any[] = xlsx.utils.sheet_to_json(ws, { raw: false });

    const YV_OE_map = new Map<string, Set<string>>();

    if (jsonData.length === 0) {
        console.warn(`Excel'de veri bulunamadı.`);
        return YV_OE_map;
    }

    jsonData.forEach((item: any) => {
        const oe = item["OE"];
        const yv = item["YV"];

        if (oe && yv) {
            if (YV_OE_map.has(oe)) {
                YV_OE_map.get(oe)?.add(yv);
            } else {
                YV_OE_map.set(oe, new Set([yv]));
            }
        }
    })
    const yv_oe_records: any[] = [];

    YV_OE_map.forEach((yvSet, oeKey) => {
        yv_oe_records.push({ OE: oeKey, YV: Array.from(yvSet) });
    });

    fs.writeFile(path.join(__dirname, '../../data/ORJ_NO.json'), JSON.stringify(yv_oe_records, null, 2));
}

convertToJSonFromExcel('../../data/ORJ_NO_KATALOG.xlsx', 'Sheet1');