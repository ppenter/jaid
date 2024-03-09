#! /usr/bin/env node

import { Command } from "commander";
import child, { spawn, execSync, exec as execute } from "child_process";
import { promises as fs } from "fs";
import util from "util";
import tsConfigTemplate from "./templates/tsconfig.json";
import chokidar from "chokidar";
const terminate = require("terminate");

const exec = util.promisify(child.exec);

const program = new Command();
import { version } from "../package.json";
import { createServer } from "./core/server";
import { createBuild } from "./core/build";
import logger from "./lib/logger";
import { delay } from "./utils/time";
import path from "path";
import { writeToFile } from "./utils/fs";
import prompt from "prompts";

const linkList = [
  "react",
  "react-dom",
  "react-router-dom",
  "react-router",
  "@types/react",
  "@types/react-dom",
  "@types/react-router-dom",
  "@types/react-router",
  "@types/node",
  "jaid"
];

// check has jaid.config.json file
const bypassCommands = ["mkproj"];

// check command is not bypassed
const checkBypass = async () => {
  if (!bypassCommands.includes(process.argv[2])) {
    const jaidConfig = path.resolve(process.cwd(), "jaid.config.json");
    const hasConfig = await fs.stat(jaidConfig).catch(() => null);
    if (!hasConfig) {
      logger.error("Please run Jaid CLI in a Jaid project directory");
      process.exit(1);
    }
  }
};

checkBypass();

program.name("Jaid CLI").version(version).description("Jaid CLI");

program
  .command("start")
  .description("Start the server")
  .action(async () => {
    let spinner = logger.spinner("Rebuilding").start();
    await createBuild();
    spinner.succeed("Build completed");
    let app = spawn("ts-node", [`${process.cwd()}/.jaid/server.js`], {
      stdio: "inherit",
    })
      .on("error", (e) => {
        logger.error(`Error: ${e.message}`);
      })
      .on("exit", (code, signal) => {});
  });

program
  .command("build")
  .description("Build the project")
  .action(async () => {
    await createBuild();
  });

program
  .command("dev")
  .description("Start the server and watch for changes")
  .action(async () => {
    logger.clear();
    let app = spawn(`jaid`, [`start`], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    chokidar
      .watch(["src", `${__dirname}/../../src`])
      .on("change", async (path, stats) => {
        // // logger.clear();
        await terminate(app.pid, (err: any) => {});
        app = spawn("jaid", [`start`], {
          stdio: "inherit",
        }).on("error", async (e) => {
          await terminate(app.pid, (err: any) => {});
          app = spawn("jaid", [`start`], {
            stdio: "inherit",
          });
        });
      });
  });

program
  .command("setup")
  .description("Setup the framework")
  .action(async () => {
    // get the cli path
    const cli_root = `${__dirname}/../..`;
    const project_root = process.cwd();

    let spinner = logger.spinner("Setting up").start();

    await Promise.all(
      linkList.map(async (pack: string) => {
        await exec(`yarn unlink ${pack}`, {
          cwd: `${cli_root}/node_modules/${pack}`,
        })
          .then(() => {})
          .catch(() => {});
        await exec(`yarn link`, { cwd: `${cli_root}/node_modules/${pack}` })
          .then(() => {})
          .catch(() => {});
        await exec(`yarn unlink ${pack}`, {
          cwd: `${project_root}`,
        })
          .then(() => {})
          .catch(() => {});
        await exec(`yarn link ${pack}`, {
          cwd: `${project_root}`,
        })
          .then(() => {})
          .catch(() => {});
      }),
    );

    spinner.succeed("Setup completed, please restart the ts server");

  });

program
  .command("new-app")
  .description("Create a new app")
  .argument("<app-name>", "Name of the app")
  .action(async (appName) => {
    const appDir = path.resolve(process.cwd(), "src/apps", appName);
    const hasDir = await fs.stat(appDir).catch(() => null);
    if (hasDir) {
      const { override } = await prompt({
        type: "confirm",
        name: "override",
        message: "App already exists. Do you want to override it?",
      });
      if (!override) {
        logger.error("Aborted");
        return;
      } else {
        logger.warn("Overriding app");
        await fs.rm(appDir, { recursive: true });
        await delay(1000);
      }
    }

    const spinner = logger.spinner("Creating app").start();
    await delay(1000);
    await writeToFile(
      `${appDir}/pages/landing/page.tsx`,
      `
import React from "react";

export default function Page() {
  return <div className="w-screen h-screen flex flex-col justify-center items-center">
  <h1 className="text-4xl font-bold">Hello</h1>
  <p className="text-xl mt-4">Greeting from ${appName}</p>
  <p className="mt-4">
  Edit this file at src/apps/${appName}/pages/landing/page.tsx
  </p>
</div>;
}
  `,
    );

    const appJs = `
    module.exports = {
      "name": "${appName}",
      "version": "0.0.1",
      "rewrites": []
    }
    `

    await writeToFile(`${appDir}/app.js`, appJs);

    // create api folder
    await fs.mkdir(`${appDir}/api`);

    // create mods folder
    await fs.mkdir(`${appDir}/doctypes`);

    // create first mod name the same as the app
    await fs.mkdir(`${appDir}/doctypes/${appName}`);

    // init git
    await execSync(`git init`, { cwd: appDir });

    spinner.stop();
    logger.success(`Successfully created app ${appName}`);
    logger.info(
      `Run 'jaid dev' to start the server and try to visit http://localhost:3000/${appName}/pages/landing`,
    );
  });

program
  .command("mkproj")
  .description("Create a new project")
  .argument("<project-name>", "Name of the project")
  .action(async (projName) => {
    // check the folder exist
    const projectDir = path.resolve(`${process.cwd()}/${projName}`);
    const hasDir = await fs.stat(projectDir).catch(() => null);
    if (hasDir) {
      const { override } = await prompt({
        type: "confirm",
        name: "override",
        message: "Project already exists. Do you want to override it?",
      });
      if (!override) {
        logger.error("Aborted");
        return;
      } else {
        logger.warn("Overriding project");
        await fs.rm(projectDir, { recursive: true });
        await delay(1000);
      }
    }

    const spinner = logger.spinner("Creating project").start();
    await delay(1000);
    await writeToFile(
      `${projectDir}/jaid.config.json`,
      JSON.stringify(
        {
          version: "0.0.1",
          apps: [],
        },
        null,
        2,
      ),
    );

    // write tailwind.config.js
    await writeToFile(
      `${projectDir}/tailwind.config.js`,
      `
  /** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,tsx,ts}"],
  theme: {
    extend: {},
  },
  plugins: [],
}

  `,
    );

    await fs.mkdir(`${projectDir}/src`);
    await fs.mkdir(`${projectDir}/src/apps`);
    await fs.mkdir(`${projectDir}/src/sites`);

    await writeToFile(
      `${projectDir}/tsconfig.json`,
      JSON.stringify(tsConfigTemplate, null, 2),
    );

    spinner.stop();
    logger.success(`Successfully created project ${projName}`);

    logger.info(`Run 'cd ${projName}' to enter the project directory`);
    // Example command usages
    logger.log(`Run 'jaid new-app <app-name>' to create a new app`);
    logger.log(`Run 'jaid dev' to start the server`);
    logger.log(`Run 'jaid build' to build the project`);
  });

// get app
program
  .command("get-app")
  .description("Get app from the repository")
  .argument("<app-name>", "Name of the app")
  .action(async (appName) => {
    const appDir = path.resolve(process.cwd(), "src/apps", appName);
    const hasDir = await fs.stat(appDir).catch(() => null);
    if (hasDir) {
      const { override } = await prompt({
        type: "confirm",
        name: "override",
        message: "App already exists. Do you want to override it?",
      });
      if (!override) {
        logger.error("Aborted");
        return;
      } else {
        logger.warn("Overriding app");
        await fs.rm(appDir, { recursive: true });
        await delay(1000);
      }
    }

    const spinner = logger.spinner("Getting an app").start();
    await delay(1000);

    const jaidConfigPath = path.resolve(process.cwd(), "jaid.config.json");
    const jaidConfig = JSON.parse(await fs.readFile(jaidConfigPath, "utf-8"));

    // clone from the repository
    await execSync(
      `git clone ${jaidConfig.repository || "https://github.com/ppenter"}/${appName}`,
      { cwd: path.resolve(process.cwd(), "src/apps") },
    );

    spinner.stop();
    logger.success(`Got app ${appName} !`);
    logger.info(
      `Run 'jaid dev' to start the server and try to visit http://localhost:3000/${appName}/pages/landing`,
    );
  });

program.parse(process.argv);
