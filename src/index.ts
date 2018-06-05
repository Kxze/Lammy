import * as bodyParser from "body-parser";
import express from "express";
import * as path from "path";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { loadConfig, loadRoutes } from "./loaders";
import { logger } from "./logger";
import { IRouteParams } from "./types";

const app = express();

app.use(bodyParser.json());

// Sets up and starts server
const main = async () => {
  const config = await loadConfig(path.join(__dirname, "../config.json"));
  const connection = await createConnection(config.database);

  const params: IRouteParams = {
    app,
    config,
    connection,
    logger,
  };

  await loadRoutes(config, path.join(__dirname, "/routes"), params);
  app.listen(config.port, () => {
    logger.info("Listening on port 3000");
  });
};

main()
  .catch(logger.error);

export default app;
