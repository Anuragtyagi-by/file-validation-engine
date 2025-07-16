# file-validation-engine

A fast, dynamic rule-based validation engine for Excel and CSV files. Supports custom rules, if/else logic, and efficient chunked processing for millions of rows. Errors are written to a file for review.

## System Flow Diagram

```
[User Provides File Path + Rules]
                |
                v
      [RuleEngine.validateFile]
                |
        +-------+-------+
        |               |
   [CSV File]      [Excel File]
        |               |
 [Stream & Chunk]  [Read & Chunk]
        |               |
        +-------+-------+
                |
        [Validate Each Chunk]
                |
        [Write Errors to File]
                |
        [Return/Notify Completion]
```

## Features
- Validate Excel (.xlsx, .xls) and CSV files
- Define custom rules per column, including if/else logic
- Handles millions of rows efficiently (chunked processing)
- Errors are written to a file with row numbers
- Easy to extend and use as an npm package
- **Configurable chunk size** for performance tuning

## Chunk Size Option

- The `chunkSize` option controls how many rows are processed at a time (default: **10,000** rows).
- You can change this value when creating the `RuleEngine` instance:

```js
const engine = new RuleEngine(rules, { chunkSize: 5000 }); // processes 5,000 rows per chunk
```
- Adjust `chunkSize` based on your available memory and file size for optimal performance.

## Usage


1. Define your rules as an array of objects specifying the column, type, validation options, custom validation, error message, and optional condition. Example:

```js
const ruleConfigs = [
  { column: 'id', type: 'integer', nullable: false },
  { column: 'price', type: 'number', maxDecimals: 3, nullable: true },
  { column: 'name', type: 'string', max: 20, nullable: false, allowEmpty: false },
  { column: 'description', type: 'string', nullable: true, allowEmpty: true },
  { column: 'email', type: 'string', allowEmpty: true, customValidate: value => /.+@.+\..+/.test(value), errorMessage: 'must be a valid email format', condition: row => row['email'] !== '' },
  { column: 'status', type: 'string', customValidate: (value, row) => value === 'active' || row['age'] > 18, errorMessage: 'must be active if age > 18' },
];
```

2. Create rules using a helper (optional):
```js
const rules = ruleConfigs.map(makeRule);
```

3. Create a `RuleEngine` instance and validate your file:
```js
const engine = new RuleEngine(rules, { chunkSize: 5000 });
const inputFile = 'input.csv';
const errorFile = 'validation_error.txt';
await engine.validateFile(inputFile, errorFile);
```

See `lib/example.js` for a sample usage.

## Install
```
npm install file-validation-engine
```

## License
MIT
