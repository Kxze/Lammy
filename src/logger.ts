import * as winston from "winston";

const myFormat = winston.format.printf(info => {
	return `${info.timestamp} [${info.level}] ${info.message}`;
});

export const logger = winston.createLogger({
	format: winston.format.combine(
		winston.format.timestamp(),
		myFormat,
	),
	level: "info",
	transports: [
		new winston.transports.File({ filename: "debug.log", level: "debug" }),
		new winston.transports.File({ filename: "error.log", level: "error" }),
		new winston.transports.File({ filename: "combined.log" }),
	],
});

if (process.env.NODE_ENV !== "production") {
	logger.add(new winston.transports.Console({
		format: myFormat,
	}));
}
