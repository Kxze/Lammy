import { Express } from "express";
import { ConnectionOptions } from "typeorm";
import { Logger } from "winston";

export interface IRouteParams {
    app: Express;
    logger: Logger;
    config: ISettings;
}

export interface ISettings {
    port: string;
    database: ConnectionOptions;
}
