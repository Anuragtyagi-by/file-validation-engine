
import { RuleEngine } from './RuleEngine';
import fs from 'fs';

// Rule configuration array (matches example.js)
const ruleConfigs = [
    { column: 'id', type: 'integer', nullable: false },
    { column: 'price', type: 'number', maxDecimals: 3, nullable: true },
    { column: 'name', type: 'string', max: 20, nullable: false, allowEmpty: false },
    { column: 'description', type: 'string', nullable: true, allowEmpty: true },
    { column: 'email', type: 'string', allowEmpty: true, customValidate: (value: string) => /.+@.+\..+/.test(value), errorMessage: 'must be a valid email format', condition: (row: any) => row['email'] !== '' },
    { column: 'status', type: 'string', customValidate: (value: string, row: any) => value === 'active' || row['age'] > 18, errorMessage: 'must be active if age > 18' },
];

function makeRule(config: any) {
    return {
        column: config.column,
        validate: (value: any, row: any) => {
            if (config.nullable && (value === null || value === undefined)) return true;
            if (config.allowEmpty && value === '') return true;
            if (config.customValidate) return config.customValidate(value, row);
            if (config.type === 'integer') return Number.isInteger(Number(value));
            if (config.type === 'number') {
                if (isNaN(Number(value))) return false;
                if (config.maxDecimals !== undefined) {
                    const parts = value.toString().split('.');
                    if (parts[1] && parts[1].length > config.maxDecimals) return false;
                }
                return true;
            }
            if (config.type === 'string') {
                if (typeof value === 'number' || Number.isInteger(Number(value))) return true;
                if (typeof value !== 'string') return false;
                if (config.max && value.length > config.max) return false;
                if (config.allowEmpty === false && value === '') return false;
                return true;
            }
            if (config.type === 'date') return value === null || !isNaN(Date.parse(value));
            return true;
        },
        errorMessage: config.errorMessage || makeErrorMessage(config),
        condition: config.condition
    };
}

function makeErrorMessage(config: any) {
    let msg = 'must be';
    if (config.nullable) msg += ' null or';
    if (config.allowEmpty) msg += ' empty or';
    if (config.type === 'integer') msg += ' an integer';
    if (config.type === 'number') msg += ' a number';
    if (config.maxDecimals !== undefined) msg += ` (max ${config.maxDecimals} decimals)`;
    if (config.type === 'string') msg += ' a string';
    if (config.max) msg += ` (max ${config.max} chars)`;
    if (config.allowEmpty === false) msg += ' and not empty';
    return msg.trim();
}

const rules = ruleConfigs.map(makeRule);

const engine = new RuleEngine(rules, { chunkSize: 5000 });

(async () => {
    const inputFile = 'input.csv'; // or 'input.xlsx'
    const errorFile = 'validation_error.txt';
    if (fs.existsSync(errorFile)) fs.unlinkSync(errorFile);
    await engine.validateFile(inputFile, errorFile);
    console.log('Validation complete. Errors written to', errorFile);
})();
