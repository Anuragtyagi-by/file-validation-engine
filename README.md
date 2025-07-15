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

1. Define your rules as an array of objects specifying the column, validation function, error message, and optional condition.
2. Create a `RuleEngine` instance and call `validateFile` with your input file and error output file.

See `src/example.ts` for a sample usage.

## Install
```
npm install file-validation-engine
```

## License
MIT
