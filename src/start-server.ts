import { createBuild } from "./core/build";
import { createServer } from "./core/server";
import logger from "./lib/logger";

const setServer = async () => {
  const spinner = logger.spinner("Starting server").start();
  await createBuild();
  await createServer();
  spinner.stop();
};

setServer();
