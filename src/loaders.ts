import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger";
import { IRouteParams, ISettings } from "./types";

export const loadRoutes = (config: ISettings, directory: string, params: IRouteParams): Promise<ISettings> => {
  return new Promise((resolve, reject) => {
    logger.info("Loading routes...");
    fs.readdir(directory, (err, files) => {
      if (err) { return reject(err); }

      files
        .filter((file) => file.endsWith(".js"))
        .forEach((file) => {
          require(path.join(directory, file)).default(params);
          logger.info("Loaded route " + file);
        });
      resolve(config);
    });
  });
};

export const loadConfig = (file: string): Promise<ISettings> => {
  return new Promise((resolve, reject) => {
    logger.info("Loading configuration file...");
    fs.readFile(file, "utf8", (err, fileData) => {
      if (err) { return reject(err); }
      try {
        const config = JSON.parse(fileData);
        return resolve(config);
      } catch (err) {
        return reject(err);
      }
    });
  });
};
