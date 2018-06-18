import { Album, Artist, Song } from "../entity";
import { IRouteParams } from "../types";

export default ({ app, connection, upload, config }: IRouteParams) => {

	app.get("/library/:type", async (req, res) => {
		const types = ["artists", "albums", "songs"];
		if (!types.includes(req.params.type)) { return res.sendStatus(404); }
		// if (!req.user) { return res.sendStatus(401); }

		const type = req.params.type;
		let data;

		if (type === "artists") {
			data = await connection.getRepository(Artist).find({
				relations: ["albums"],
			});
		} else if (type === "albums") {
			data = await connection.getRepository(Album).find({
				relations: ["artists"],
			});
		} else {
			data = await connection.getRepository(Song).find({
				select: ["id", "name", "sortName"],
				relations: ["artists", "albums"],
			});
		}

		return res.send(data);
	});

};
