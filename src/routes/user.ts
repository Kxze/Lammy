import * as bcrypt from "bcrypt";
import { User } from "../entity";
import { checkBody } from "../middleware";
import { IRouteParams } from "../types";

export default ({ app, config, connection, logger }: IRouteParams) => {

  app.post("/auth/register", async (req, res) => {
    if (!req.body || !req.body.username || !req.body.password || !req.body.email) { return res.sendStatus(400); }

    const user = new User();
    user.username = req.body.username;
    user.password = await bcrypt.hash(req.body.password, config.security.rounds);

    try {
      await connection.manager.save(user);
      return res.status(200).send();
    } catch (err) {
      // If duplicate
      if (err.errno === 1062 && err.message.includes("username")) {
        return res.status(409).json({ error: 409, message: "Username already exists" });
      } else if (err.errno === 1062 && err.message.includes("email")) {
        return res.status(409).json({ error: 409, message: "E-mail already exists" });
      }

      logger.error(err);
      return res.status(500).send();
    }

  });

};
