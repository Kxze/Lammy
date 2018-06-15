import * as fs from "fs";
import * as path from "path";
import Server from "upnpserver";
import { promisify } from "util";
import { logger } from "./logger";
import { IRouteParams, ISettings } from "./types";

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

export let upnpServer: any;

export const loadRoutes = async (config: ISettings, directory: string, params: IRouteParams) => {
	try {
		logger.info("Loading routes...");
		const files = await readDir(directory);

		files
			.filter((file) => file.endsWith(".js") || file.endsWith(".ts"))
			.forEach((file) => {
				require(path.join(directory, file)).default(params);
				logger.info("Loaded route " + file);
			});
	} catch (err) {
		logger.error(err.message);
	}
};

export const loadConfig = async () => {
	try {
		const file = path.join(__dirname, process.env.NODE_ENV === "test" ? "../config.test.json" : "../config.json");

		logger.info("Loading configuration file...");
		const fileData = await readFile(file, "utf8");

		return JSON.parse(fileData);
	} catch (err) {
		logger.error(err.message);
		return undefined;
	}
};

export function startDLNAServer(library: string) {
	upnpServer = new Server({
		name: "Lammy Server",
		log: true,
		logLevel: "DEBUG",
	}, [{
		path: library,
		type: "music",
	}]);
	
	upnpServer.start();

	return upnpServer;
}
