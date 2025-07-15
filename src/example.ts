import { RuleEngine, Rule } from './RuleEngine';
import fs from 'fs';

// Example rules: customize as needed
const rules: Rule[] = [
    {
        column: 'age',
        validate: (value) => !isNaN(Number(value)) && Number(value) > 0,
        errorMessage: 'Age must be a positive number',
    },
    {
        column: 'email',
        validate: (value) => /.+@.+\..+/.test(value),
        errorMessage: 'Invalid email format',
        condition: (row) => row['email'] !== '', // Only if email is present
    },
    {
        column: 'status',
        validate: (value, row) => value === 'active' || row['age'] > 18,
        errorMessage: 'Status must be active if age > 18',
    },
];

const engine = new RuleEngine(rules, { chunkSize: 5000 });

(async () => {
    const inputFile = 'input.csv'; // or 'input.xlsx'
    const errorFile = 'validation_errors.txt';
    if (fs.existsSync(errorFile)) fs.unlinkSync(errorFile);
    await engine.validateFile(inputFile, errorFile);
    console.log('Validation complete. Errors written to', errorFile);
})();
