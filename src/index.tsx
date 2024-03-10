import React from "react";
import express from "express";
import ReactDOMServer, { renderToString } from "react-dom/server";
import { Html } from "./components/App";
import { StaticRouter } from "react-router-dom/server";
import logger from "./lib/logger";
import { ErrorPage } from "./components/Error";
import { getApps, getPage } from "./utils/fs";
import { getAllRewrites, rewritePath } from "./core/rewrite";
import { createServer } from "./core/server";
import { delay } from "./utils/time";

export interface IResponse {
  send: (data: string) => void;
  status: (code: number) => void;
  cookie: (name: string, value: string, options: any) => void;
}

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
  delay,
};
