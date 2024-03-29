import React from "react";
import express from "express";
import ReactDOMServer, { renderToString } from "react-dom/server";
import { Html } from "../components/App";
import { StaticRouter } from "react-router-dom/server";
import logger from "../lib/logger";
import { ErrorPage } from "../components/Error";
import { getApps, getPage } from "../utils/fs";
import { getAllRewrites, rewritePath } from "./rewrite";
import { ServerSidePropsProvider } from "../components/SSRPropsContext";
import { ServerSideParamsProvider } from "../components/SSRParamsContext";
import { pathToFileURL } from "node:url";

const app = express();

export const createServer = async (
  App: (props?: any) => React.ReactElement,
) => {
  const _apps = await getApps();
  app.use("/dist", express.static(`.jaid`));

  // middleware
  app.use(async (req, res, next) => {
    const site = req.hostname;
    if (req.url.endsWith("/")) req.url = req.url.slice(0, -1);
    if (req.url === "") req.url = "/";

    if (req.url === "/favicon.ico") return res.send("");
    if (req.url.startsWith("/dist")) {
      return next();
    }
    if (req.url.startsWith("/public")) {
      return next();
    }

    const rewrites = await getAllRewrites(_apps);
    const newPath = await rewritePath(req.url, rewrites);

    logger.debug(`Rewriting path: ${req.url} to ${newPath}`);

    req.url = `${newPath}`;
    return next();
  });

  app.use("/api/:app/:path(*)", async (req, res) => {
    try {
      const { app, path } = req.params;

      const reqMethod = req.method.toLowerCase();
      const apiPath = `${process.cwd()}/.jaid/cjs/apps/${app}/api/${path}.js`;
      const api = await import(pathToFileURL(apiPath).href);
      const handler = api[reqMethod.toUpperCase()];
      const data = await handler(req, res);
      res.status(200).send(data);
    } catch (e: any) {
      logger.error(e);
      res.status(500).send(e.message);
    }
  });

  app.get("*", async (req, res) => {
    try {
      const page = await getPage(req.url.split("?")[0]);

      const query = req.query;

      const ServerSideComponent = page.page;

      const props = page?.ssp ? await page?.ssp() : undefined;

      const entryPoint = props ? ["/dist/client.js"] : ["/dist/client.js"];

      const { pipe, abort: _abort } = ReactDOMServer.renderToPipeableStream(
        <ServerSidePropsProvider value={props}>
          <ServerSideParamsProvider value={{}}>
            <StaticRouter location={req.url}>
              <Html
                props={{
                  ...props,
                  query: query || {},
                  params: page.params || {},
                }}
                css={page.css}
              >
                <App
                  {...props}
                  query={query || {}}
                  params={page?.params || {}}
                />
              </Html>
            </StaticRouter>
          </ServerSideParamsProvider>
        </ServerSidePropsProvider>,
        {
          bootstrapScripts: entryPoint,
          onShellReady() {
            res.statusCode = 200;
            res.setHeader("Content-type", "text/html; charset=utf-8");
            pipe(res);
          },
          onShellError() {
            res.statusCode = 500;
            res.send(
              ReactDOMServer.renderToString(
                <Html>
                  <ErrorPage code={500} message={"Something went wrong"} />
                </Html>,
              ),
            );
          },
        },
      );
    } catch (e: any) {
      logger.error(e);
      res.statusCode = 500;
      res.send(
        ReactDOMServer.renderToString(
          <Html>
            <ErrorPage code={500} message={"Something went wrong"} />
          </Html>,
        ),
      );
    }
  });
  const server = app.listen(3000, () => {
    // logger.spinner("Server started on http://localhost:3000").succeed();
  });

  server.on("close", () => {
    logger.error("Server closed");
  });

  return server;
};
