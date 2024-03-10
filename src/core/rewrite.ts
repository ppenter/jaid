import { PRESERVE_REWRITES } from "../constant";
import logger from "../lib/logger";
import { getAppConfig } from "../utils/fs";

export function matchPath(path: string, pathRegex: string) {
  let regexPattern = pathRegex
    .replace(/\/\[\.\.\.(\w+)\]/g, "/(?<$1>.+)") // Replace [...param] with a named capturing group that matches everything
    .replace(/\/:(\w+)\*/g, "/(?<$1>.+)") // Replace :param* with a named capturing group that matches everything
    .replace(/\[\.\.\.(\w+)\]/g, "(?<$1>[^/]+)") // Handle embedded wildcards
    .replace(/:(\w+)/g, "(?<$1>[^/]+)") // Replace :param with a named capturing group that matches until the next slash
    .replace(/\[(\w+)\]/g, "(?<$1>[^/]+)") // Replace [param] with a named capturing group that matches until the next slash
    .replace(/\//g, "\\/"); // Escape forward slashes

  // Add start and end line anchors
  const regex = new RegExp(`^${regexPattern}$`);

  const match = path.match(regex);
  if (match) {
    let params = {} as any;
    // Extract the named capturing groups as params
    for (let [key, value] of Object.entries(match.groups || {})) {
      params[key] = value;
    }
    return { match: true, params };
  } else {
    return { match: false, params: {} };
  }
}

export function extractParamsFromPath(path: string, pattern: string) {
  const { params } = matchPath(path, pattern);
  return params || null;
}

export function constructNewPath(
  params: { [s: string]: unknown } | ArrayLike<unknown>,
  toPattern: any,
) {
  let newPath = toPattern;

  // Replace named parameters in the toPattern with their values from params
  for (const [key, value] of Object.entries(params)) {
    newPath = newPath.replace(new RegExp(`:${key}\\*?`, "g"), value);
  }

  return newPath;
}

export const getAllRewrites = async (apps: string[]) => {
  const rewrites = await Promise.all(
    apps.map(async (app) => {
      const app_config = await getAppConfig(app);
      return app_config?.rewrites || [];
    }),
  );
  return [...rewrites.flat(Infinity), ...PRESERVE_REWRITES];
};

export const reverseRewrite = (path: string, rewrites: any[]) => {
  for (const rewrite of rewrites) {
    const { match, params } = matchPath(path, rewrite.to);
    if (match) {
      return constructNewPath(params, rewrite.from);
    }
  }
  return path;
};

export const rewritePath = (path: string, rewrites: any[]) => {
  const _rewrites = [...rewrites, ...PRESERVE_REWRITES];
  for (const rewrite of _rewrites) {
    const { match, params } = matchPath(path, rewrite.from);
    if (match) {
      return constructNewPath(params, rewrite.to);
    }
  }
  return path;
};
