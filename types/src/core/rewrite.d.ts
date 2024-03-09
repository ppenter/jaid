export declare function matchPath(path: string, pathRegex: string): {
    match: boolean;
    params: any;
};
export declare function extractParamsFromPath(path: string, pattern: string): any;
export declare function constructNewPath(params: {
    [s: string]: unknown;
} | ArrayLike<unknown>, toPattern: any): any;
export declare const getAllRewrites: (apps: string[]) => Promise<any[]>;
export declare const reverseRewrite: (path: string, rewrites: any[]) => any;
export declare const rewritePath: (path: string, rewrites: any[]) => any;
