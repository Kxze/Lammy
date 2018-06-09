import { Express } from "express";
import { Instance as MulterInstance } from "multer";
import { Connection, ConnectionOptions } from "typeorm";
import { Logger } from "winston";

export interface IRouteParams {
	app: Express;
	logger: Logger;
	config: ISettings;
	connection: Connection;
	upload: MulterInstance;
}

export interface ISecurity {
	rounds: string | number;
	encryptionKey: string;
	issuer: string;
	expiration: string;
}

export interface ISettings {
	port: string;
	library: string;
	database: ConnectionOptions;
	security: ISecurity;
}
