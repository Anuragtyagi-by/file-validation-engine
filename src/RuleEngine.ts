import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse';
import * as XLSX from 'xlsx';

export type Rule = {
    column: string;
    validate: (value: any, row: any) => boolean;
    errorMessage: string;
    condition?: (row: any) => boolean; // for if/else logic
};

export interface RuleEngineOptions {
    chunkSize?: number; // number of rows per chunk
}

export class RuleEngine {
    private rules: Rule[];
    private options: RuleEngineOptions;

    constructor(rules: Rule[], options: RuleEngineOptions = {}) {
        this.rules = rules;
        this.options = { chunkSize: 10000, ...options };
    }

    async validateFile(
        filePath: string,
        outputErrorFile: string
    ): Promise<void> {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.csv') {
            await this.validateCSV(filePath, outputErrorFile);
        } else if (ext === '.xlsx' || ext === '.xls') {
            await this.validateExcel(filePath, outputErrorFile);
        } else {
            throw new Error('Unsupported file type');
        }
    }

    private async validateCSV(filePath: string, outputErrorFile: string) {
        return new Promise<void>((resolve, reject) => {
            const readStream = fs.createReadStream(filePath);
            const parser = csvParse({ columns: true });
            let rowNum = 1;
            let chunk: any[] = [];
            let headers: string[] = [];
            let isFirstChunk = true;

            const writeErrors = (errors: string[]) => {
                if (errors.length > 0) {
                    fs.appendFileSync(outputErrorFile, errors.join('\n') + '\n');
                }
            };

            parser.on('headers', (h) => { headers = h; });
            parser.on('readable', () => {
                let record;
                while ((record = parser.read())) {
                    chunk.push(record);
                    if (chunk.length >= this.options.chunkSize!) {
                        const errors = this.validateChunk(chunk, rowNum);
                        writeErrors(errors);
                        rowNum += chunk.length;
                        chunk = [];
                    }
                }
            });
            parser.on('end', () => {
                if (chunk.length > 0) {
                    const errors = this.validateChunk(chunk, rowNum);
                    writeErrors(errors);
                }
                resolve();
            });
            parser.on('error', reject);
            readStream.pipe(parser);
        });
    }

    private async validateExcel(filePath: string, outputErrorFile: string) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        let rowNum = 1;
        for (let i = 0; i < rows.length; i += this.options.chunkSize!) {
            const chunk = rows.slice(i, i + this.options.chunkSize!);
            const errors = this.validateChunk(chunk, rowNum);
            if (errors.length > 0) {
                fs.appendFileSync(outputErrorFile, errors.join('\n') + '\n');
            }
            rowNum += chunk.length;
        }
    }

    private validateChunk(chunk: any[], startRow: number): string[] {
        const errors: string[] = [];
        chunk.forEach((row, idx) => {
            this.rules.forEach((rule) => {
                if (rule.condition && !rule.condition(row)) return;
                if (!rule.validate(row[rule.column], row)) {
                    errors.push(
                        `Row ${startRow + idx}: [${rule.column}] ${rule.errorMessage} (value: ${row[rule.column]})`
                    );
                }
            });
        });
        return errors;
    }
}
