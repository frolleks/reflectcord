/*
  Fosscord: A FOSS re-implementation and extension of the Discord.com backend.
  Copyright (C) 2023 Fosscord and Fosscord Contributors

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/* eslint-disable camelcase */
import SemanticSDP from "semantic-sdp";
import { GatewayCloseCodes } from "discord.js";
import { Logger } from "@reflectcord/common/utils";
import { VoiceOPCodes } from "@reflectcord/common/sparkle";
import { APIWrapper, createAPI } from "@reflectcord/common/rvapi";
import { Payload } from "@reflectcord/gateway/util";
import { PublicIP } from "@reflectcord/common/constants";
import { VoiceState } from "@reflectcord/common/mongoose";
import defaultsdp from "../../util/sdp.json";
import {
  endpoint, getClients, Send, WebSocket,
} from "../../util";

export async function onIdentify(this: WebSocket, data: Payload) {
  clearTimeout(this.readyTimeout);
  Logger.log("Identifying...");

  const identify = data.d!;

  const {
    token, user_id, session_id, server_id, video, streams,
  } = identify;

  const voiceState = await VoiceState.findOne({ user_id, session_id });
  if (!voiceState || !voiceState?.channel_id) return this.close(GatewayCloseCodes.UnknownError);

  this.rvAPI = createAPI({
    token,
  });
  // @ts-ignore
  this.rvAPIWrapper = new APIWrapper(this.rvAPI);
  this.sessionId = session_id;
  this.token = token;
  const user = await this.rvAPIWrapper.users.fetchSelf();
  this.rv_user_id = user.revolt._id;
  this.user_id = user.discord.id;

  const sdp = SemanticSDP.SDPInfo.expand(defaultsdp);
  sdp.setDTLS(SemanticSDP.DTLSInfo.expand({
    setup: "actpass",
    hash: "sha-256",
    fingerprint: endpoint.getDTLSFingerprint(),
  }));

  this.client = {
    websocket: this,
    out: {
      tracks: new Map(),
    },
    in: {
      audio_ssrc: 0,
      video_ssrc: 0,
      rtx_ssrc: 0,
    },
    sdp,
    channel_id: voiceState.channel_id,
  };

  const currentUser = await this.rvAPIWrapper.users.getSelf();
  this.bot = !!currentUser.bot;

  const clients = getClients(voiceState.channel_id)!;
  clients.add(this.client);

  this.on("close", () => {
    if (this.client) clients.delete(this.client);
  });

  const readyBody: any = {
    streams: [
      /*
      {
        type: "video",
        ssrc: this.client.in.video_ssrc + 1,
        rtx_ssrc: this.client.in.video_ssrc + 2,
        rid: "100",
        quality: 100,
        active: false,
      },
      */
    ],
    ssrc: this.client.in.audio_ssrc,
    ip: PublicIP,
    port: endpoint.getLocalPort(),
    modes: [
      "aead_aes256_gcm_rtpsize",
      "aead_aes256_gcm",
      "xsalsa20_poly1305_lite_rtpsize",
      "xsalsa20_poly1305_lite",
      "xsalsa20_poly1305_suffix",
      "xsalsa20_poly1305",
    ],
    // heartbeat_interval: 1,
    experiments: [],
  };

  if (this.bot) readyBody.heartbeat_interval = 1;

  await Send(this, {
    op: VoiceOPCodes.Ready,
    d: readyBody,
  });
}
