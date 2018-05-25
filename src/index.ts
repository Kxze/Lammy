import express from "express";
import * as path from "path";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { loadConfig, loadRoutes } from "./loaders";
import { logger } from "./logger";
import { IRouteParams } from "./types";

const app = express();

// Sets up and starts server
loadConfig(path.join(__dirname, "../config.json"))
  .then((config) => {
    const params: IRouteParams = {
      app,
      config,
      logger,
    };

    return loadRoutes(config, path.join(__dirname, "/routes"), params);
  })
  .then((config) => {
    logger.info("Loading database...");
    createConnection(config.database)
      .then(connection => {
        app.listen(config.port, () => {
          logger.info("Listening on port 3000");
        });
      })
      .catch(logger.error);
  })
  .catch(logger.error);
