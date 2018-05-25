import * as fs from "fs";
import { IRouteParams } from "../types";

const fileStats = (path: string): Promise<fs.Stats> => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) { return reject(err); }
      return resolve(stats);
    });
  });
};

export default ({ app }: IRouteParams) => {

  app.get("/song/:id", async (req, res) => {
    if (typeof req.headers.range !== "string") { return res.sendStatus(400); }

    const path = __dirname + "/../../music/Sophie - Ponyboy.mp3";
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
