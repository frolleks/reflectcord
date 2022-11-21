/* eslint-disable camelcase */
import { Request, Response } from "express";
import { Resource } from "express-automatic-routes";
import { APIChannel, ChannelType as discordChannelType, RESTPostAPIGuildChannelJSONBody } from "discord.js";
import { ulid } from "ulid";
import { HTTPError } from "@reflectcord/common/utils";
import {
  fromSnowflake, Channel, ChannelCreateBody, GuildCategory,
} from "@reflectcord/common/models";

const validTypes = [
  discordChannelType.GuildText,
  discordChannelType.GuildVoice,
  discordChannelType.GuildCategory,
];

export default () => <Resource> {
  post: async (
    req: Request<any, any, RESTPostAPIGuildChannelJSONBody>,
    res: Response<APIChannel>,
  ) => {
    const { body } = req;
    const {
      name, type, parent_id,
    } = body;
    const { guild_id } = req.params;

    if (type && !validTypes.includes(type)) throw new HTTPError(`Unimplemented channel type ${type}`, 500);
    if (!guild_id || !name) throw new HTTPError("Invalid params");

    const rvId = await fromSnowflake(guild_id);

    if (type === discordChannelType.GuildCategory) {
      const categoryId = ulid();
      const currentServer = await res.rvAPI.get(`/servers/${rvId as ""}`);
      const newServer = await res.rvAPI.patch(`/servers/${rvId as ""}`, {
        categories: [...currentServer.categories ?? [], {
          channels: [],
          id: categoryId,
          title: name,
        }],
      });

      const rvCategory = newServer.categories?.find((x) => x.id === categoryId);
      if (!rvCategory) throw new HTTPError("Category couldn't be found on the server", 500);

      res.status(201).json(await GuildCategory.from_quark(rvCategory, {
        server: rvId,
      }));
    } else {
      const rvChannel = await res.rvAPI.post(`/servers/${rvId as ""}/channels`, await ChannelCreateBody.to_quark(body));
      // FIXME: Should we throw an error here if not server or just passthrough?
      if (parent_id && ("server" in rvChannel && rvChannel.server)) {
        const rvCategory = await (async () => {
          try {
            const sf = await fromSnowflake(parent_id.toString());
            return sf;
          } catch {
            return parent_id.toString();
          }
        })();

        const rvServer = await res.rvAPI.get(`/servers/${rvId as ""}`);
        const categoryToPatch = rvServer.categories?.find((x) => x.id === rvCategory);
        if (!categoryToPatch) throw new HTTPError("Category doesn't exist");
        await res.rvAPI.patch(`/servers/${rvId as ""}`, {
          categories: [...rvServer.categories ?? [], {
            id: rvCategory,
            title: categoryToPatch.title,
            channels: [...categoryToPatch.channels, rvChannel._id],
          }],
        });
        res.status(201).json(await Channel.from_quark(rvChannel, {
          categoryId: rvCategory,
        }));
        return;
      }

      res.status(201).json(await Channel.from_quark(rvChannel));
    }
  },
};
