import * as ts from "typescript";

export const compile = (code: string, options: ts.CompilerOptions = {}) => {
  const compilerOptions: ts.CompilerOptions = {
    ...options,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    paths: {
      "@/*": ["src/apps/*"],
    },
  };

  const result = ts.transpileModule(code, {
    compilerOptions,
  });

  return result.outputText;
};
