import * as esbuild from "esbuild";
import { getApps, getPages, writeToFile } from "../utils/fs";
import { promises as fs } from "fs";
import storage from "../lib/storage";
import logger from "../lib/logger";
import { exec } from "child_process";
import glob from "../lib/global";
import { compile } from "../lib/complier";
import { getAllRewrites, rewritePath } from "./rewrite";

export const filePathToImportName = (filePath: string) => {
  // replace / with _ and remove .tsx replace : with empty
  return filePath
    .replace("src/", "")
    .replace(".tsx", "")
    .replace(/\//g, "_")
    .replace(":", "");
};

const getBaseTsConfig = async () => {
  const config = {
    exclude: ["node_modules"],
    include: ["src/**/*"],
    compilerOptions: {
      module: "ESNext",
      lib: ["DOM", "ESNext"],
      importHelpers: true,
      declaration: true,
      sourceMap: true,
      outDir: "./.jaid",
      rootDir: "./src",
      strict: true,
      isolatedModules: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      moduleResolution: "node",
      jsx: "react",
      esModuleInterop: true,
      target: "ES2017",
      baseUrl: ".",
      paths: {
        "@/*": ["src/apps/*"],
      },
    },
  };
  return config;
};

const reactESBuildPlugin = {
  name: "react",
  setup(build: esbuild.PluginBuild) {
    // handle .tsx files
    build.onLoad({ filter: /\.tsx$/ }, async (args) => {
      const file = await fs.readFile(args.path, "utf8").catch(() => null);
      if (file) {
        // get default export of file
        const defaultExport = file.match(/export default (.+)/)?.[1];
        const functionOrConstName =
          defaultExport?.split(" ")[0] == "const"
            ? defaultExport?.split(" ")[1]
            : defaultExport?.split(" ")[1].split("(")[0];
        // adding REACTDOM render to end of file and import React and ReactDOM
        const newFile =
          file +
          `
                import React from 'react';
                import { createRoot } from 'react-dom/client';
                const container = document.getElementById('root');
                const root = createRoot(container);
                if (root) {
                    root.render(<${functionOrConstName} />);
                }
                `;

        return {
          contents: newFile,
          loader: "tsx",
        };
      }
      return null;
    });
  },
};

export const isFileHasExtensions = (page: string, exts: string[]) => {
  return exts.includes(`.${page.split(".").pop()}` as string);
};

const updateOrInsertPagesStorage = async (pages: {}) => {
  const storage_pages = storage.get("pages") || {};
  storage.put("pages", {
    ...storage_pages,
    ...pages,
  });
};

const deletePagesStorage = async (pages: {}) => {
  const storage_pages = storage.get("pages") || {};
  const new_pages = { ...storage_pages };
  for (const page in pages) {
    delete new_pages[page];
  }
  storage.put("pages", new_pages);
};

export const createBuild = async (options?: {
  _pages?: string[];
  rebuild?: boolean;
  type?: "update" | "delete" | "create";
}) => {
  const { rebuild, _pages } = options || {};
  !rebuild && logger.log("Retriving Pages");
  
    // if not rebuild delete .jaid folder
    if (!rebuild) {
        await fs.rm('.jaid', { recursive: true });
        // create .jaid folder
        await fs.mkdir('.jaid');
        // init storage
        storage.put('pages', {});
    }

  const apps = await getApps();

  const allTsx =
    _pages ||
    ((
      await Promise.all(
        apps.map(async (app) => {
          const _allTsx = await getPages(`src/apps/${app}`, {
            exts: [".tsx"],
          });
          return _allTsx.flat(Infinity) as string[];
        }),
      )
    ).flat(Infinity) as string[]);

  const onlyPages = allTsx.filter((page) => {
    // end with page.tsx
    return page.endsWith("page.tsx");
  });
  const _apps = await getApps();
  const rewrites = await getAllRewrites(_apps);

  const pageIndex = onlyPages.reduce((acc, page, index) => {
    const path = page.replace("src/apps", "").replace("/page.tsx", "");
    const rewrite_path = rewritePath(path, rewrites);
    return {
      ...acc,
      [page]: {
        path: path,
        index: `PAGE_${index}`,
      },
    };
  }, {}) as any;

  switch (options?.type) {
    case "update":
      updateOrInsertPagesStorage(pageIndex);
      break;
    case "delete":
      deletePagesStorage(pageIndex);
      break;
    case "create":
      updateOrInsertPagesStorage(pageIndex);
      break;
    default:
      updateOrInsertPagesStorage(pageIndex);
      break;
  }

  var p = Promise.resolve();

  glob.pages = onlyPages;

  const tsConfig = JSON.parse(await fs.readFile("tsconfig.json", "utf8"));

  const clientJs = `
    import React from 'react';
    import { hydrateRoot } from 'react-dom/client';
    import { BrowserRouter, Routes, Route } from 'react-router-dom';
    ${Object.keys(pageIndex)
      .map((page) => {
        const index = pageIndex[page].index;
        return `import ${index} from '../${page.replace(".tsx", "")}'`;
      })
      .join("\n")}

    const container = document.getElementById('root') as any;
    const root = hydrateRoot(container, 
        <React.StrictMode>
        <BrowserRouter>
        <Routes>
        ${Object.keys(pageIndex)
          .map((page: string) => {
            const index = pageIndex[page].index;
            const path = pageIndex[page].path;
            return `<Route path="${path}" Component={${index}} />`;
          })
          .join("\n")}
        </Routes>
        </BrowserRouter>  
        </React.StrictMode>
    );
    `;

  // create react client.js
  await fs.writeFile(`./.jaid/client.tsx`, clientJs);

  await esbuild.build({
    entryPoints: ["./.jaid/client.tsx"],
    bundle: true,
    outfile: `.jaid/client.js`,
    loader: {
      ".tsx": "tsx",
    },
  });

  await Promise.all(
    allTsx.map(async (page) => {
      p = p.then(async () => {
        const source = await fs.readFile(page, "utf8");

        const result = compile(source, tsConfig.complierOptions);

        await writeToFile(
          `${process.cwd()}/.jaid/cjs/${page.replace("src/", "").replace(".tsx", ".js")}`,
          result,
        );

        logger.debug(
          `${rebuild ? "Rebuilt".padEnd(8) : "Built".padEnd(8)}| ${page}`,
        );
      });
    }),
  );

//   delete client.tsx
    await fs.rm(`./.jaid/client.tsx`);

  return p;
};
