import { NextFunction, Request, Response } from "express";

export const protect = (minimumLevel: number) => (req: Request, res: Response, next: NextFunction) => {
	if (!req.user) { return res.status(401).send({ message: "You must be logged in to perform this action." }); }

	if (req.user.level < minimumLevel) {
		return res.status(403).send({ message: "You don't have enough permissions to perform this action" });
	}

	next();
};
