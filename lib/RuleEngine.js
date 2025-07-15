"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parse_1 = require("csv-parse");
const XLSX = __importStar(require("xlsx"));
class RuleEngine {
    constructor(rules, options = {}) {
        this.rules = rules;
        this.options = { chunkSize: 10000, ...options };
    }
    async validateFile(filePath, outputErrorFile) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        if (ext === '.csv') {
            await this.validateCSV(filePath, outputErrorFile);
        }
        else if (ext === '.xlsx' || ext === '.xls') {
            await this.validateExcel(filePath, outputErrorFile);
        }
        else {
            throw new Error('Unsupported file type');
        }
    }
    async validateCSV(filePath, outputErrorFile) {
        return new Promise((resolve, reject) => {
            const readStream = fs_1.default.createReadStream(filePath);
            const parser = (0, csv_parse_1.parse)({ columns: true });
            let rowNum = 1;
            let chunk = [];
            let headers = [];
            let isFirstChunk = true;
            const writeErrors = (errors) => {
                if (errors.length > 0) {
                    fs_1.default.appendFileSync(outputErrorFile, errors.join('\n') + '\n');
                }
            };
            parser.on('headers', (h) => { headers = h; });
            parser.on('readable', () => {
                let record;
                while ((record = parser.read())) {
                    chunk.push(record);
                    if (chunk.length >= this.options.chunkSize) {
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
    async validateExcel(filePath, outputErrorFile) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        let rowNum = 1;
        for (let i = 0; i < rows.length; i += this.options.chunkSize) {
            const chunk = rows.slice(i, i + this.options.chunkSize);
            const errors = this.validateChunk(chunk, rowNum);
            if (errors.length > 0) {
                fs_1.default.appendFileSync(outputErrorFile, errors.join('\n') + '\n');
            }
            rowNum += chunk.length;
        }
    }
    validateChunk(chunk, startRow) {
        const errors = [];
        chunk.forEach((row, idx) => {
            this.rules.forEach((rule) => {
                if (rule.condition && !rule.condition(row))
                    return;
                if (!rule.validate(row[rule.column], row)) {
                    errors.push(`Row ${startRow + idx}: [${rule.column}] ${rule.errorMessage} (value: ${row[rule.column]})`);
                }
            });
        });
        return errors;
    }
}
exports.RuleEngine = RuleEngine;
