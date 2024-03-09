import * as ts from "typescript";

export const compile = (_code: string, options: ts.CompilerOptions = {}) => {

  const code = replaceImportPathsWithAbsolute(_code, process.cwd() + '/src/apps');

  const compilerOptions: ts.CompilerOptions = {
    ...options,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true
  };

  const result = ts.transpileModule(code, {
    compilerOptions: compilerOptions,
  });

  return result.outputText;
};


export const findImportPath = (code: string): string[] => {
  // Remove the 'g' flag to avoid issues with the regex state
  const importRegex = /import.*from\s*['"](.*)['"]/;
  // Use matchAll for global matching
  const matches = Array.from(code.matchAll(new RegExp(importRegex, 'g')));
  
  return matches.map(match => match[1]);
}

export const replaceImportPathsWithAbsolute = (code: string, basePath: string): string => {
  const importRegex = /import\s+(.*\s+)?from\s*['"](.*)['"]/g;

  const replacedCode = code.replace(importRegex, (match, imports, path) => {
    // Assuming the paths to replace start with "@/"
    if (!path.startsWith('@/')) return match; // Skip non-relative paths

    // Convert the relative path to an absolute path
    const absolutePath = path.replace(/^@\//, `${basePath}/`);
    return `import ${imports ? imports : ''}from '${absolutePath}'`;
  });

  return replacedCode;
};