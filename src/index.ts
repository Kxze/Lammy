import * as bodyParser from "body-parser";
import express, { Request, Response } from "express";
import multer from "multer";
import * as path from "path";
import "reflect-metadata";
import { createConnection } from "typeorm";
import { loadConfig, loadRoutes, startDLNAServer } from "./loaders";
import { logger } from "./logger";
import { IRouteParams } from "./types";
import cors from "cors";

const app = express();

app.use(bodyParser.json());
app.use(cors());

// Sets up and starts server
const main = async () => {
	const config = await loadConfig();
	const connection = await createConnection(config.database);
	const upload = multer({ dest: __dirname + "/../uploads/" });
	const DLNAServer = startDLNAServer(config.library);

	const params: IRouteParams = {
		app,
		config,
		connection,
		logger,
		upload,
		DLNAServer,
	};

	await loadRoutes(config, path.join(__dirname, "/routes"), params);

	app.use((err: any, req: Request, res: Response, next: any) => {
		logger.warn(err.message);

		if (process.env.NODE_ENV === "development") {
			return res.status(500).send({ error: err.message });
		} else {
			return res.sendStatus(500);
		}
	});

	app.listen(config.port, () => {
		logger.info("Listening on port 3000");
	});
};

if (process.env.NODE_ENV !== "test") {
	main()
		.catch((err) => logger.error(err.message));
}

export default main;
