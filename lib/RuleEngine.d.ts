export type Rule = {
    column: string;
    validate: (value: any, row: any) => boolean;
    errorMessage: string;
    condition?: (row: any) => boolean;
};
export interface RuleEngineOptions {
    chunkSize?: number;
}
export declare class RuleEngine {
    private rules;
    private options;
    constructor(rules: Rule[], options?: RuleEngineOptions);
    validateFile(filePath: string, outputErrorFile: string): Promise<void>;
    private validateCSV;
    private validateExcel;
    private validateChunk;
}
