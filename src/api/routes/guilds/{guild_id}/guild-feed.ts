/* eslint-disable camelcase */
import { Response } from "express";
import { Resource } from "express-automatic-routes";
import { fromSnowflake } from "../../../../common/models/util";
import { GuildFeedResponse } from "../../../../common/sparkle/schemas";
import { HTTPError } from "../../../../common/utils";

export default () => <Resource> {
  get: async (req, res: Response<GuildFeedResponse>) => {
    const { guild_id } = req.params;

    if (!guild_id) throw new HTTPError("Invalid params");

    const serverId = await fromSnowflake(guild_id);

    // const server = await res.rvAPIWrapper.servers.fetch(serverId);

    // FIXME
    res.json({
      results: {
        items: [],
      },
    });
  },
};
