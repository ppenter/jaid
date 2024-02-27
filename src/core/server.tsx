import React from "react";
import express from "express";
import ReactDOMServer, { renderToString } from "react-dom/server";
import { Html } from "../components/App";
import { StaticRouter } from "react-router-dom/server";
import logger from "../lib/logger";
import {
  constructNewPath,
  getAllRewrites,
  matchPath,
  rewritePath,
} from "./rewrite";
import { getAppConfig, getApps, getPage } from "../utils/fs";
import nocache from "nocache";
import { ErrorPage } from "../components/Error";

const app = express();
app.use(nocache());

export const createServer = async (_pages?: any) => {
  const _apps = await getApps();
  app.use("/js", express.static(`.jaid`));
  app.use("/jss", express.static(`${__dirname}/../../../jss`));

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

  app.get("*", async (req, res) => {
    try{
      const page = await getPage(req.url.split("?")[0]);
      

    const ServerSideComponent = page.page;

    const props = page?.page?.getServerSideProps
      ? await page?.page?.getServerSideProps()
      : undefined;

    if (props) {
      logger.info(`Serving [SSR] ${page.path}`);
    } else {
      logger.info(`Serving [CSR] ${page.path}`);
    }

    const entryPoint = props ? undefined : ["/js/client.js"];

    const { pipe, abort: _abort } = ReactDOMServer.renderToPipeableStream(
      <StaticRouter location={req.url}>
       <Html>
       {ServerSideComponent ? <ServerSideComponent {...props} /> : 
              <ErrorPage/>
              }
       </Html>
      </StaticRouter>,
      {
        bootstrapScripts: entryPoint,
        onShellReady() {
          res.statusCode = 200;
          res.setHeader("Content-type", "text/html");
          pipe(res);
        },
        onShellError() {
          res.statusCode = 500;
          res.send(ReactDOMServer.renderToString(<Html>
            <ErrorPage code={500} message={'Something went wrong'} />
          </Html>));
        },
      },
    );
    }catch(e: any){
      logger.error(e);
      res.statusCode = 500;
      res.send(ReactDOMServer.renderToString(<Html>
        <ErrorPage code={500} message={'Something went wrong'} />
      </Html>));
    }
  });
  const server = app.listen(3000, () => {});

  server.on("close", () => {
    logger.error("Server closed");
  });

  return server;
};
