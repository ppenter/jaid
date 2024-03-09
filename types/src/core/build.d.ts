export declare const filePathToImportName: (filePath: string) => string;
export declare const isFileHasExtensions: (page: string, exts: string[]) => boolean;
export declare const createBuild: (options?: {
    _pages?: string[];
    rebuild?: boolean;
    type?: "update" | "delete" | "create";
}) => Promise<void>;
