import { Request, Response } from "express";
import { wrap } from "express-promise-wrap";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { Album, Artist, Song } from "../entity";
import { IRouteParams } from "../types";

const rename = promisify(fs.rename);

export default ({ app, connection, upload, config }: IRouteParams) => {

	app.post("/song/upload", upload.single("file"), wrap(async (req: Request, res: Response) => {
		if (!req.body || !req.file) { return res.sendStatus(400); }
		const { artist, name, album } = req.body;

		const albumRepository = await connection.getRepository(Album);
		const dbAlbum = await albumRepository.findOne({ name: album }) || new Album();
		dbAlbum.name = album;
		await connection.getRepository(Album).save(dbAlbum);

		const artistRepository = await connection.getRepository(Artist);
		const dbArtist = await artistRepository.findOneById(req.body.artistId) || new Artist();
		if (!dbArtist.name && !req.body.artist) {
			return res.status(404).send({ message: "Could not find an artist with id " + req.body.artistId });
		}

		dbArtist.name = dbArtist.name || artist;
		dbArtist.albums = dbArtist.albums ? [...dbArtist.albums, dbAlbum] : [];
		await connection.getRepository(Artist).save(dbArtist);

		const songRepository = await connection.getRepository(Song);
		const dbSong = await songRepository
			.createQueryBuilder("song")
			.leftJoinAndSelect("song.artists", "artist")
			.leftJoinAndSelect("song.albums", "album")
			.where("song.name = :name AND artist.name = :artist AND album.name = :album", {
				name, artist, album,
			})
			.getOne();

		if (dbSong) {
			return res.status(409).send({ message: "Song already exists in the database." });
		}

		const destination = path.join(config.library, `${artist} - ${name}.mp3`);
		await rename(req.file.path, destination);

		const newSong = new Song();
		newSong.name = name;
		newSong.albums = [dbAlbum];
		newSong.artists = [dbArtist];
		newSong.location = destination;
		await connection.getRepository(Song).save(newSong);

		return res.sendStatus(200);
	}));

};
