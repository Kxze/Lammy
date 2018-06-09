import * as jwt from "jsonwebtoken";
import passport from "passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { User } from "../entity";
import { IRouteParams } from "../types";

export default ({ app, config, connection, logger }: IRouteParams) => {
	const createToken = (user: User) => {
		return new Promise((resolve, reject) => {
			const options = {
				expresIn: config.security.expiration,
				issuer: config.security.issuer,
			};

			const payload = {
				id: user.id,
			};

			jwt.sign(payload, config.security.encryptionKey, options, (err, token) => {
				if (err) { return reject(err); }
				resolve(token);
			});
		});
	};

	const jwtOptions = {
		issuer: config.security.issuer,
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
		secretOrKey: config.security.encryptionKey,
	};

	passport.use(new JwtStrategy(jwtOptions, async (payload, callback) => {
		const user = await connection.getRepository(User).findOne(payload.id);
		return callback(null, user || false);
	}));

	app.post("/auth/login", async (req, res) => {
		if (!req.body.username || !req.body.password) { return res.status(400).json(); }

		const { username, password } = req.body;
		const user = await connection.getRepository(User).findOne({ username });

		if (!user) { return res.sendStatus(404); }
		if (!await user.verifyPassword(password)) { return res.status(401).json({ message: "Incorrect password" }); }

		const token = await createToken(user);
		return res.json({ token });
	});
};
