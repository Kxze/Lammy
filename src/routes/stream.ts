import * as fs from "fs";
import { promisify } from "util";
import { Song } from "../entity";
import { IRouteParams } from "../types";

const fileStats = promisify(fs.stat);

export default ({ app, connection }: IRouteParams) => {

  app.get("/song/:id", async (req, res) => {
    if (typeof req.headers.range !== "string") { return res.sendStatus(400); }
    const song = await connection.getRepository(Song).findOneById(req.params.id);
    if (!song) { return res.status(404).send({ message: "Could not find song with id " + req.params.id }); }

    const path = song.location;
    const stat = await fileStats(path);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(path, { start, end });
      const head = {
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Type": "audio/mpeg",
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        "Content-Length": fileSize,
        "Content-Type": "audio/mpeg",
      };
      res.writeHead(200, head);
      fs.createReadStream(path).pipe(res);
    }
  });
  
};
