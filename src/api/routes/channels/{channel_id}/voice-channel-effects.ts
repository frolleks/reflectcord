/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import { DbManager } from "@reflectcord/common/db";
import { HTTPError } from "@reflectcord/common/utils";
import { emitEvent } from "@reflectcord/common/Events";
import { fromSnowflake, toSnowflake } from "@reflectcord/common/models";
import { GatewayDispatchCodes } from "@reflectcord/common/sparkle/schemas/Gateway/Dispatch";

const voiceStates = DbManager.client.db("reflectcord")
  .collection("voiceStates");

export default () => <Resource> {
  post: async (req, res) => {
    const { channel_id } = req.params;
    if (!channel_id) throw new HTTPError("Invalid params");

    const user_id = await toSnowflake(await res.rvAPIWrapper.users.getSelfId());

    const state = await voiceStates.findOne({ user_id });
    if (state?.channel_id !== channel_id) throw new HTTPError("You are not in a voice call.", 404);

    await emitEvent({
      event: GatewayDispatchCodes.VoiceChannelEffectSend,
      data: {
        animation_id: req.body.animation_id,
        animation_type: req.body.animation_type,
        channel_id,
        emoji: {
          name: req.body.emoji_name,
          id: req.body.emoji_id,
          animated: false,
        },
        user_id,
      },
      channel_id: await fromSnowflake(channel_id),
    });

    res.sendStatus(204);
  },
};
