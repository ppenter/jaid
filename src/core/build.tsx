import * as esbuild from "esbuild";
import { getApps, getPages, writeToFile } from "../utils/fs";
import { PathLike, promises as fs, default as fss } from "fs";
import storage from "../lib/storage";
import logger from "../lib/logger";
import child from "child_process";
import util from "util";
import glob from "../lib/global";
import { compile } from "../lib/complier";
import { getAllRewrites, reverseRewrite, rewritePath } from "./rewrite";
import path from "path";

const exec = util.promisify(child.exec);

const CSSPlugin = {
  name: "css-inject",
  setup(build: any) {
    // Filter for .tsx files
    build.onLoad(
      { filter: /\.tsx$/ },
      async (args: { path: PathLike | fs.FileHandle }) => {
        let contents = await fs.readFile(args.path, "utf8");

        // Regex to find CSS import statements
        const cssImportRegex = /import\s+['"](.+\.css)['"];?/g;

        // Replace each CSS import with an inject function
        contents = contents.replace(cssImportRegex, (match, cssPath) => {
          // Resolve the CSS path relative to the .tsx file
          const fullPath = `${path.dirname(args.path.toString())}/${cssPath}`;
          const cssCode = fss
            .readFileSync(fullPath, "utf8")
            .trim()
            .replace(/`/g, "\\`");
          // Return a replacement code that injects the CSS into the document
          return `
        export const getStyleSheet = \`${cssCode}\`;
        `;
        });

        return { contents, loader: "tsx" };
      },
    );
  },
};

export const filePathToImportName = (filePath: string) => {
  // replace / with _ and remove .tsx replace : with empty
  return filePath
    .replace("src/", "")
    .replace(".tsx", "")
    .replace(/\//g, "_")
    .replace(":", "");
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
  let time = Date.now();
  let buildTime = [
    {
      title: "Start Build",
      time: (time - Date.now()) / 1000,
    },
  ];
  const lap = (title: string) => {
    // console.log(`${title} - ${((Date.now() - time) / 1000).toFixed(2)}s`);
    buildTime.push({
      title,
      time: (time - Date.now()) / 1000,
    });
    time = Date.now();
  };
  // !rebuild && logger.log("Retriving Pages");

  // if not rebuild delete .jaid folder
  if (!rebuild) {
    await fs.rm(".jaid", { recursive: true });
    // create .jaid folder
    await fs.mkdir(".jaid");
    // init storage
    storage.put("pages", {});
  }

  lap("Create .jaid folder");

  const apps = await getApps();

  lap("Get Apps");

  const allTsx =
    _pages ||
    ((
      await Promise.all(
        apps.map(async (app) => {
          const _allTsx = await getPages(`src/apps/${app}`, {
            exts: [".tsx", ".ts"],
          });
          return _allTsx.flat(Infinity) as string[];
        }),
      )
    ).flat(Infinity) as string[]);

  lap("Get All TSX");

  const onlyPages = allTsx.filter((page) => {
    // end with page.tsx
    return page.endsWith("page.tsx");
  });

  const rewrites = await getAllRewrites(apps);

  lap("Get All Rewrites");

  const pageIndex = onlyPages.reduce((acc, page, index) => {
    // if page contains [...slug] then replace it with *
    const path = page.replace("src/apps", "").replace("/page.tsx", "");
    // const path = page.replace("src/apps", "").replace("/page.tsx", "");
    const rewrite_path = reverseRewrite(path, rewrites);
    return {
      ...acc,
      [page]: {
        path: path,
        rewritePath: rewrite_path,
        index: `PAGE_${index}`,
      },
    };
  }, {}) as any;

  lap("Create Page Index");

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

  lap("Update Pages Storage");

  var p = Promise.resolve();

  glob.pages = onlyPages;

  const tsConfig = JSON.parse(await fs.readFile(`tsconfig.json`, "utf8"));

  const appTsx = `
    import React from 'react';
    import {Routes, Route} from 'react-router';
    
    ${Object.keys(pageIndex)
      .map((page) => {
        const index = pageIndex[page].index;
        return `import ${index} from '${process.cwd()}/${page.replace(".tsx", "")}'`;
      })
      .join("\n")}

    const App = (props: any) => {
      return(
        <Routes>
        ${Object.keys(pageIndex)
          .map((page: string) => {
            const index = pageIndex[page].index;
            const path = pageIndex[page].path;
            const rewritePath = pageIndex[page].rewritePath
              .replace(/\[\.\.\.(.*)\]/, "*")
              .replace(/\[(.*)\]/, ":$1");
            return `
            <Route path="${rewritePath}"  element={<${index} {...props}/>} />
            <Route path="${path}"  element={<${index} {...props}/>} />
            `;
          })
          .join("\n")}
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      )
    }

    export default App;
    `;

  await writeToFile(`./.jaid/App.tsx`, appTsx);

  // const appResult = compile(appTsx, tsConfig.compilerOptions);

  // await writeToFile(`./.jaid/App.js`, appResult);
  await esbuild.build({
    entryPoints: ["./.jaid/App.tsx"],
    bundle: true,
    outfile: `.jaid/App.js`,
    loader: {
      ".tsx": "tsx",
      ".ts": "ts",
    },
    // external: ["fs", "path"],
    external: [
      "fs",
      "path",
      "os",
      "child_process",
      "readline",
      "querystring",
      "crypto",
      "http",
      "https",
      "url",
      "zlib",
      "stream",
      "tty",
      "util",
      "assert",
      "net",
      "dns",
      "tls",
      "events",
      "buffer",
      "string_decoder",
      "punycode",
      "process",
      "v8",
      "vm",
      "async_hooks",
      "perf_hooks",
      "worker_threads",
      "node:events",
      "node:fs",
      "node:os",
      "node:child_process",
      "node:readline",
      "node:querystring",
      "node:crypto",
      "node:http",
      "node:https",
      "node:url",
      "node:zlib",
      "node:stream",
      "node:tty",
      "node:util",
      "node:assert",
      "node:net",
      "node:dns",
      "node:tls",
      "node:events",
      "node:buffer",
      "node:string_decoder",
      "node:punycode",
      "node:process",
      "node:v8",
      "node:vm",
      "node:async_hooks",
      "node:perf_hooks",
      "node:worker_threads",
      "ora",
      "esbuild",
    ],
  });

  lap("Create App TSX");

  const clientTsx = `
    import React from 'react';
    import { hydrateRoot } from 'react-dom/client';
    import { BrowserRouter } from 'react-router-dom';
    import App from './App';

    const container = document.getElementById('root') as any;
    const root = hydrateRoot(container, 
      <BrowserRouter>
      <App {...(window as any)?.__INITIAL__DATA__}/>
      </BrowserRouter>  
    );
    `;

  // create react client.js
  await fs.writeFile(`./.jaid/client.tsx`, clientTsx);

  await esbuild.build({
    entryPoints: ["./.jaid/client.tsx"],
    bundle: true,
    outfile: `.jaid/client.js`,
    loader: {
      ".tsx": "tsx",
      ".ts": "ts",
    },
    external: ["fs", "path", "esbuild"],
    // external: ["fs", "path", "os", "child_process", "readline", "querystring", "crypto", "http", "https", "url", "zlib", "stream", "tty", "util", "assert", "net", "dns", "tls", "events", "buffer", "string_decoder", "punycode", "process", "v8", "vm", "async_hooks", "perf_hooks", "worker_threads", "node:events", "node:fs", "node:os", "node:child_process", "node:readline", "node:querystring", "node:crypto", "node:http", "node:https", "node:url", "node:zlib", "node:stream", "node:tty", "node:util", "node:assert", "node:net", "node:dns", "node:tls", "node:events", "node:buffer", "node:string_decoder", "node:punycode", "node:process", "node:v8", "node:vm", "node:async_hooks", "node:perf_hooks", "node:worker_threads", "ora"]
  });

  lap("Create Client TSX");

  // server tsx
  const serverTsx = `
    import { createServer, logger, delay } from "jaid";
    import App from "./App";

    async function main() {
    let spinner = await logger.spinner("Building").start();
    await createServer(App);
    await spinner.succeed("🚀 Server @ http://localhost:3000");
    }
    main();
    `;

  // create server.js
  await fs.writeFile(`./.jaid/server.tsx`, serverTsx);

  // build server
  // const serverResult = compile(serverTsx, tsConfig.compilerOptions);

  // await writeToFile(`./.jaid/server.js`, serverResult);
  await esbuild.build({
    entryPoints: ["./.jaid/server.tsx"],
    bundle: true,
    outfile: `.jaid/server.js`,
    loader: {
      ".tsx": "tsx",
    },
    platform: "node",
    external: ["fs", "esbuild"],
    // external: ["fs", "path", "os", "child_process", "readline", "querystring", "crypto", "http", "https", "url", "zlib", "stream", "tty", "util", "assert", "net", "dns", "tls", "events", "buffer", "string_decoder", "punycode", "process", "v8", "vm", "async_hooks", "perf_hooks", "worker_threads", "node:events", "node:fs", "node:os", "node:child_process", "node:readline", "node:querystring", "node:crypto", "node:http", "node:https", "node:url", "node:zlib", "node:stream", "node:tty", "node:util", "node:assert", "node:net", "node:dns", "node:tls", "node:events", "node:buffer", "node:string_decoder", "node:punycode", "node:process", "node:v8", "node:vm", "node:async_hooks", "node:perf_hooks", "node:worker_threads", "ora"]
  });

  lap("Create Server TSX");

  await Promise.all(
    allTsx.map(async (page) => {
      p = p.then(async () => {
        // const source = await fs.readFile(page, "utf8");
        // const result = compile(source, tsConfig.compilerOptions);

        // await writeToFile(
        //   `${process.cwd()}/.jaid/cjs/${page.replace("src/", "").replace(".tsx", ".js").replace(".ts", ".js")}`,
        //   result,
        // );
        await esbuild.build({
          entryPoints: [page],
          bundle: true,
          outfile: `${process.cwd()}/.jaid/cjs/${page.replace(".tsx", ".js").replace(".ts", ".js").replace("src/", "")}`,
          loader: {
            ".tsx": "tsx",
            ".ts": "ts",
          },
          platform: "node",
          plugins: [CSSPlugin],
          // external: ["fs", "path", "os", "child_process", "readline", "querystring", "crypto", "http", "https", "url", "zlib", "stream", "tty", "util", "assert", "net", "dns", "tls", "events", "buffer", "string_decoder", "punycode", "process", "v8", "vm", "async_hooks", "perf_hooks", "worker_threads", "node:events", "node:fs", "node:os", "node:child_process", "node:readline", "node:querystring", "node:crypto", "node:http", "node:https", "node:url", "node:zlib", "node:stream", "node:tty", "node:util", "node:assert", "node:net", "node:dns", "node:tls", "node:events", "node:buffer", "node:string_decoder", "node:punycode", "node:process", "node:v8", "node:vm", "node:async_hooks", "node:perf_hooks", "node:worker_threads", "ora"]
        });

        const css_path = page.replace(".tsx", ".css").replace(".ts", ".css");
        try {
          await esbuild.build({
            entryPoints: [page.replace(".tsx", ".css").replace(".ts", ".css")],
            bundle: true,
            outfile: `${process.cwd()}/.jaid/cjs/${page.replace(".tsx", ".css").replace(".ts", ".css").replace("src/", "")}`,
            logLevel: "silent",
          });
        } catch (e) {
          // console.log()
        }

        if (storage.get("pages")[page]) {
          storage.put("pages", {
            ...storage.get("pages"),
            [page]: {
              ...storage.get("pages")[page],
              css: `dist/cjs/${css_path.replace("src/", "")}`,
            },
          });
        }
      });
    }),
  );

  lap("Create Pages");

  // remove tsx files
  await fs.rm(`./.jaid/App.tsx`);
  await fs.rm(`./.jaid/client.tsx`);
  await fs.rm(`./.jaid/server.tsx`);
  // remove css files
  await fs.rm(`./.jaid/App.css`);
  await fs.rm(`./.jaid/client.css`);
  await fs.rm(`./.jaid/server.css`);

  // lap("Remove TSX");

  // build tailwind uncomment this if beta is ready
  // await exec(
  //   `npx tailwindcss build -i ${__dirname}/../../../src/index.css -o ./.jaid/tailwind.css`,
  //   {
  //     cwd: process.cwd(),
  //   },
  // );

  // lap("Build Tailwind");

  // console.table(buildTime);

  return p;
};
