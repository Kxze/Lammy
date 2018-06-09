import { Request, Response } from "express";
import { wrap } from "express-promise-wrap";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import NodeID3 from "node-id3";
import * as path from "path";
import { Connection } from "typeorm";
import { isNumber, promisify } from "util";
import ytdl from "ytdl-core";
import { Album, Artist, Song } from "../entity";
import { logger } from "../logger";
import { IRouteParams, ISettings } from "../types";

const rename = promisify(fs.rename);

export default ({ app, connection, config, upload, DLNAServer }: IRouteParams) => {

	app.post("/song/upload", upload.single("file"), wrap(async (req: Request, res: Response) => {
		if (!req.body || !req.file) { return res.sendStatus(400); }
		const { artist, name, album } = req.body;

		try {
			const { dbSong, dbAlbum, dbArtist } = await getDbMetadata(connection, album, artist, name);

			if (dbSong) {
				return res.status(409).send({ message: "Song already exists in the database." });
			}

			const destination = formatFileNameWithPath(config, artist, name);
			await rename(req.file.path, destination + ".mp3");

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
		await downloadAndWriteAudio(req.body.url, destination);
		await convertToMp3(destination + ".webM", destination + ".mp3");
		await promisify(fs.unlink)(destination + ".webM");

		await writeID3Tags(name, dbAlbum.name, dbArtist.name, destination + ".mp3");

		await createSong(name, dbAlbum, dbArtist, destination, connection);
		return res.send();
	});

};

function writeID3Tags(name: string, album: string, artist: string, file: string) {
	return new Promise((resolve, reject) => {
		const tags = {
			title: name,
			album,
			artist,
		};

		NodeID3.write(tags, file, (err: any) => {
			if (err) { reject(err); }

			resolve();
		});
	});
}

function formatFileNameWithPath(config: ISettings, artist: string, name: string) {
	return path.join(config.library, `${artist} - ${name}`);
}

function downloadAndWriteAudio(url: string, destination: string) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(destination + ".webM");

		const stream = ytdl(url, {
			quality: "highestaudio",
			filter: "audioonly",
		}).pipe(file);

		stream.on("open", () => {
			logger.debug("Downloading started...");
		});

		stream.on("finish", () => {
			logger.debug("Downloading finished.");
			resolve();
		});

		stream.on("error", (err) => {
			logger.error(err);
			reject(err);
		});
	});
}

function convertToMp3(file: string, destination: string) {
	return new Promise((resolve, reject) => {
		const command = ffmpeg(fs.createReadStream(file))
			.output(fs.createWriteStream(destination))
			.toFormat("mp3")
			.withNoVideo()
			.withAudioFrequency(44100)
			.withAudioChannels(2)
			.withAudioBitrate("320k")
			.on("start", (commandLine: string) => {
				logger.debug("Spawned FFMPEG with command: " + commandLine);
			})
			.on("error", (err) => {
				logger.error(err);
				reject(err);
			})
			.on("end", () => {
				logger.debug("Transcoding finished!");
				resolve();
			})
			.run();
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
