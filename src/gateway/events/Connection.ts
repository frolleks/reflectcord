/* eslint-disable no-param-reassign */
import { GatewayCloseCodes, GatewayOpcodes } from "discord.js";
import { IncomingMessage } from "http";
import ws from "ws";
import { createDeflate } from "zlib";
import { Send, setHeartbeat } from "../util";
import { WebSocket } from "../Socket";
import { Message } from "./Message";

export async function Connection(this: ws.Server, socket: WebSocket, request: IncomingMessage) {
  try {
    console.log("someones here");

    socket.on("close", () => {
      console.log("closed");
    });

    // @ts-ignore
    socket.on("message", Message);

    socket.encoding = "json";

    socket.version = 8;
    if (socket.version !== 8) return socket.close(GatewayCloseCodes.InvalidAPIVersion);

    // @ts-ignore
    socket.compress = "";
    if (socket.compress) {
      if (socket.compress !== "zlib-stream") return socket.close(GatewayCloseCodes.DecodeError);
      socket.deflate = createDeflate({ chunkSize: 65535 });
      socket.deflate.on("data", (chunk) => socket.send(chunk));
    }

    socket.events = {};
    socket.member_events = {};
    socket.permissions = {};
    socket.sequence = 0;

    setHeartbeat(socket);

    await Send(socket, {
      op: GatewayOpcodes.Hello,
      d: {
        heartbeat_interval: 1000 * 30,
      },
    });

    socket.readyTimeout = setTimeout(
      () => socket.close(GatewayCloseCodes.SessionTimedOut),
      1000 * 30,
    );
  } catch (e) {
    console.error(e);
    return socket.close(GatewayCloseCodes.UnknownError);
  }
}
