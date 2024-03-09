import { Html } from "./components/App";
import { StaticRouter } from "react-router-dom/server";
import logger from "./lib/logger";
import { ErrorPage } from "./components/Error";
import { getApps, getPage } from "./utils/fs";
import { getAllRewrites, rewritePath } from "./core/rewrite";
import { createServer } from "./core/server";
export {
  Html,
  StaticRouter,
  logger,
  ErrorPage,
  getApps,
  getPage,
  getAllRewrites,
  rewritePath,
  createServer,
};
