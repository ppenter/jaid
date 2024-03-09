import * as ts from "typescript";
export declare const compile: (_code: string, options?: ts.CompilerOptions) => string;
export declare const findImportPath: (code: string) => string[];
export declare const replaceImportPathsWithAbsolute: (code: string, basePath: string) => string;
