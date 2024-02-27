import logger from "../lib/logger";
import { getAppConfig } from "../utils/fs";

export function matchPath(path: string, pathRegex: string) {
  // Extract named parameters and wildcards, replace them with regex groups
  const paramNames: any[] = [];
  let regexPattern = pathRegex
    .split("/")
    .map((segment: string) => {
      if (segment.startsWith(":")) {
        if (segment.endsWith("*")) {
          paramNames.push(segment.slice(1, -1)); // Remove ":" and "*" from the paramName
          return "(.*)"; // Match any characters including slashes
        } else {
          paramNames.push(segment.slice(1)); // Remove ":" from the paramName
          return "([^\\/]+)"; // Match any characters except slashes
        }
      } else {
        return segment; // Static segment, include as-is
      }
    })
    .join("\\/"); // Rejoin segments with escaped slashes

  regexPattern = `^${regexPattern}$`;
  const regex = new RegExp(regexPattern);

  // Test the path against the generated regex
  const match = path.match(regex);
  if (match) {
    // Extract captured parameter values
    const params = paramNames.reduce((acc, paramName, index) => {
      acc[paramName] = match[index + 1]; // match[0] is the full match, parameters start from index 1
      return acc;
    }, {});

    return { match: true, params };
  }

  return { match: false, params: {} };
}

export function extractParamsFromPath(path: string, pattern: string) {
  const regexParts = pattern
    .split("/")
    .map((segment: string) => {
      if (segment.startsWith(":")) {
        if (segment.endsWith("*")) {
          return "(.*)"; // Match any characters including slashes for wildcards
        }
        return "([^\\/]+)"; // Match any characters except slashes for named parameters
      }
      return segment.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&"); // Escape regex special characters
    })
    .join("\\/");
  const regex = new RegExp(`^${regexParts}$`);
  const match = path.match(regex);

  if (!match) {
    return null; // No match found
  }

  // Return captured values for named parameters and wildcards
  return match.slice(1);
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
  return rewrites.flat(Infinity);
};

export const rewritePath = (path: string, rewrites: any[]) => {
  for (const rewrite of rewrites) {
    const { match, params } = matchPath(path, rewrite.from);
    if (match) {
      return constructNewPath(params, rewrite.to);
    }
  }
  return path;
};
