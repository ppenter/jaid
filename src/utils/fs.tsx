import { promises as fs } from "fs";
import path from "path";
import { BUILD_CONSTANT } from "../constant";
import logger from "../lib/logger";
import storage from "../lib/storage";
import { matchPath } from "../core/rewrite";
import { JSDOM } from "jsdom";

export const removeExtension = (file: string) => {
  return file.split(".").slice(0, -1).join(".");
};

export const getApps = async () => {
  const apps = await fs.readdir("src/apps");
  // return folder only
  return apps.filter((app) => {
    return !app.includes(".");
  });
};

// recursive function to get all files in a directory with a specific extension
export const getPages = async (
  dir: string,
  options: {
    exts: string[];
  },
) => {
  const files = await fs.readdir(dir);
  const pages = (await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return await getPages(filePath, options);
      } else {
        if (options.exts.includes(path.extname(file))) {
          const chpath = `${BUILD_CONSTANT.appsDir}/:app/:path*`;
          const { match } = matchPath(removeExtension(filePath), chpath);
          if (match) {
            return filePath;
          } else {
            return undefined;
          }
        }
      }
    }) as any,
  )) as any;
  return pages
    .filter((page?: string) => page !== undefined)
    .flat(Infinity) as string[];
};

export const getPage = async (path: string) => {
  try {
    const storage_pages = storage.get("pages") as any;

    let page_params = null;

    const _page_path = Object.keys(storage_pages).find((page) => {
      const json = storage_pages[page];
      // json.path, json.index
      const {match, params} = matchPath(path, json.path);
      if (match) {
        page_params = params;
      }
      return match;
    }
    );

    if (!_page_path) {
      throw new Error("Page not found");
    }
    logger.debug(
      `Found page: ${_page_path} with params: ${JSON.stringify(page_params)}`,
    );

    // const page_path = `${process.cwd()}/${BUILD_CONSTANT.appsDir}${path}.tsx`;
    const page_path = `${process.cwd()}/.jaid/cjs/${removeExtension(_page_path.split("src/").pop() || "")}.js`;
    await fs.stat(page_path);

    const page = await import(page_path);

    const js = `/dist/${_page_path.replace(".tsx", ".js").split("src/").pop()}`;

    return {
      page: page.default,
      js: js,
      path: _page_path,
      params: page_params,
      ssp: page?.getServerSideProps,
    };
  } catch (e) {
    logger.error(`404: ${path} ${e}`);
    return {
      page: null,
      js: "",
    };
  }
};


export const getAppConfig = async (app: string) => {
  try {
    // const appConfigPath = `src/apps/${app}/app.ts`
    const appConfigPath = `${process.cwd()}/src/apps/${app}/app.js`;
    await fs.stat(appConfigPath);
    const appJS = await import(appConfigPath);
    return appJS?.config || {}
  } catch (e) {
    logger.error(`404: ${app} ${e}`);
    return {};
  }
};

const getfileDirectory = (filePath: string) => {
  return filePath.split("/").slice(0, -1).join("/");
};

export const writeToFile = async (path: string, content: string) => {
  const dir = getfileDirectory(path);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path, content);
};
