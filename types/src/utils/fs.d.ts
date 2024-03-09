export declare const removeExtension: (file: string) => string;
export declare const getApps: () => Promise<string[]>;
export declare const getPages: (dir: string, options: {
    exts: string[];
}) => Promise<string[]>;
export declare const getPage: (path: string) => Promise<{
    page: any;
    js: string;
    path: any;
    params: any;
    ssp: any;
    css: any;
} | {
    page: null;
    js: string;
    path?: undefined;
    params?: undefined;
    ssp?: undefined;
    css?: undefined;
}>;
export declare const getAppConfig: (app: string) => Promise<any>;
export declare const writeToFile: (path: string, content: string) => Promise<void>;
