import { Request, Response } from "express";
import { wrap } from "express-promise-wrap";
import * as fs from "fs";
import * as path from "path";
import { Connection } from "typeorm";
import { isNumber, promisify } from "util";
import ytdl from "ytdl-core";
import { Album, Artist, Song } from "../entity";
import { IRouteParams, ISettings } from "../types";

const rename = promisify(fs.rename);

export default ({ app, connection, config, upload }: IRouteParams) => {

	app.post("/song/upload", upload.single("file"), wrap(async (req: Request, res: Response) => {
		if (!req.body || !req.file) { return res.sendStatus(400); }
		const { artist, name, album } = req.body;

		try {
			const { dbSong, dbAlbum, dbArtist } = await getDbMetadata(connection, album, artist, name);

			if (dbSong) {
				return res.status(409).send({ message: "Song already exists in the database." });
			}

			const destination = formatFileNameWithPath(config, artist, name);
			await rename(req.file.path, destination);

			await createSong(name, dbAlbum, dbArtist, destination, connection);

			return res.sendStatus(200);
		} catch (err) {
			if (err === "Artist not found") {
				return res.status(404).send({ message: err });
			} else {
				return res.sendStatus(500);
			}
		}
	}));

	app.post("/song/youtube", async (req, res) => {
		if (!req.body || !req.body.url) { return res.sendStatus(400); }

		const { album, artist, name } = req.body;
		const { dbSong, dbAlbum, dbArtist } = await getDbMetadata(connection, album, artist, name);

		if (dbSong) {
			return res.status(409).json({ message: "Song already exists in the database." });
		}

		const destination = formatFileNameWithPath(config, artist, name);
		await downloadAndWriteMp3(req.body.url, destination);

		await createSong(name, dbAlbum, dbArtist, destination, connection);
		return res.send();
	});

};

function formatFileNameWithPath(config: ISettings, artist: string, name: string) {
	return path.join(config.library, `${artist} - ${name}.mp3`);
}

function downloadAndWriteMp3(url: string, destination: string) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(destination);
		const stream = ytdl(url).pipe(file);

		stream.on("finish", () => {
			resolve();
		});

		stream.on("error", (err) => {
			reject(err);
		});
	}); 
}

async function getDbMetadata(connection: Connection, album: string, artist: string, name: string) {
	const dbAlbum = await findOrCreateAlbum(connection, album);
	const dbArtist = await findOrCreateArtist(connection, artist, dbAlbum);
	const dbSong = await findSong(connection, name, artist, album);

	return { dbSong, dbAlbum, dbArtist };
}

async function createSong(name: string, album: Album, artist: Artist, location: string, connection: Connection) {
	const newSong = new Song();
	newSong.name = name;
	newSong.albums = [album];
	newSong.artists = [artist];
	newSong.location = location;

	await connection.getRepository(Song).save(newSong);
}

async function findSong(connection: Connection, name: any, artist: any, album: any) {
	const songRepository = await connection.getRepository(Song);
	const dbSong = await songRepository
		.createQueryBuilder("song")
		.leftJoinAndSelect("song.artists", "artist")
		.leftJoinAndSelect("song.albums", "album")
		.where("song.name = :name AND artist.name = :artist AND album.name = :album", {
			name, artist, album,
		})
		.getOne();

	return dbSong;
}

async function findOrCreateArtist(connection: Connection, artist: string | number, album: Album) {
	const repository = await connection.getRepository(Artist);

	let dbArtist: Artist;
	if (isNumber(artist)) {
		const data = await repository.findOneById(artist);
		if (!data) { throw new Error("Artist not found"); }
		dbArtist = data;
	} else {
		dbArtist = await repository.findOne({
			where: {
				name: artist,
			},
		}) || new Artist();

		dbArtist.name = artist;
		dbArtist.albums = dbArtist.albums || [];
	}

	dbArtist.albums.push(album);
	await repository.save(dbArtist);

	return dbArtist;
}

async function findOrCreateAlbum(connection: Connection, album: string) {
	const repository = await connection.getRepository(Album);
	const dbAlbum = await repository.findOne({ name: album }) || new Album();

	dbAlbum.name = album;

	await repository.save(dbAlbum);

	return dbAlbum;
}
