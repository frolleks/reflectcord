import { GatewayOpcodes as DiscordjsOPCodes } from "discord.js";

/**
 * Documented and undocumented OPCodes
 * sent/received by the discord gateway
 */
export enum GatewayOpcodes {
  Dispatch = DiscordjsOPCodes.Dispatch,
  Heartbeat = DiscordjsOPCodes.Heartbeat,
  Identify = DiscordjsOPCodes.Identify,
  PresenceUpdate = DiscordjsOPCodes.PresenceUpdate,
  VoiceStateUpdate = DiscordjsOPCodes.VoiceStateUpdate,
  /**
   * Sent: This opcode is used to ping a voice server, whatever that means.
   * The functionality of this opcode isn't known well but non-user clients
   * should never send it.
   *
   * An example of what is usually sent to it is:
   * {
   *   delay: int,
   *   speaking: boolean,
   *   ssrc: int
   * }
   */
  VoicePing = 5,
  Resume = DiscordjsOPCodes.Resume,
  Reconnect = DiscordjsOPCodes.Reconnect,
  RequestGuildMembers = DiscordjsOPCodes.RequestGuildMembers,
  InvalidSession = DiscordjsOPCodes.InvalidSession,
  Hello = DiscordjsOPCodes.Hello,
  HeartbeatAck = DiscordjsOPCodes.HeartbeatAck,
  /**
   * Requests member/presence information
   */
  GuildSync = 12,
  /**
   * Client wants the voice state of users in a given DM/group channel.
   * You should emit each voice state to the client under the VOICE_STATE_UPDATE
   * event.
   *
   * Structure:
   * {
   *  channel_id: Snowflake
   * }
   *
   * This is called "CALL_CONNECT" by the official client
   */
  CallSync = 13,
  /**
   * Name called by the discord client: "Guild subscriptions"
   *
   * OP 14 is used by the client when wanting to load the member list of a guild.
   * When the client wants to load the member list, it describes its request in detail.
   * That is what the channels field is for. It explicitly says which parts of the
   * member list the client wants. For example, in the official client,
   * it preloads the first 100 members in the list, then requesting more as time goes by,
   * so the only range being requested in its OP 14 is [0, 99].
   * Once a client requests a certain range, it is considered "subscribed" to that range
   * and will receive respective GUILD_MEMBER_LIST_UPDATE events related to those ranges.
   */
  LazyRequest = 14,
  LobbyConnect = 15,
  LobbyDisconnect = 16,
  LobbyVoiceStatesUpdate = 17,
  StreamCreate = 18,
  StreamDelete = 19,
  StreamWatch = 20,
  StreamPing = 21,
  StreamSetPaused = 22,
  QueryApplicationCommands = 24,
  // EMBEDDED_ACTIVITY_LAUNCH
  EmbeddedActivityLaunch=25,
  // EMBEDDED_ACTIVITY_CLOSE
  EmbeddedActivityClose=26,
  // EMBEDDED_ACTIVITY_UPDATE
  EmbeddedActivityUpdate=27,
  // REQUEST_FORUM_UNREADS
  RequestForumUnreads=28,
  /**
   * REMOTE_COMMAND
   *
   * @summary Execute an OPCode for another session on your account. This is likely used by
   * Xbox and Playstation voice chat integration.
   *
   * @example
   * {
   *  target_session_id: string,
   *  payload: PayloadBody
   * }
  */
  RemoteCommand=29,
  // GET_DELETED_ENTITY_IDS_NOT_MATCHING_HASH
  GetDeletedEntityIdsNotMatchingHash=30,
  // REQUEST_SOUNDBOARD_SOUNDS
  RequestSoundboardSounds=31,
  // SPEED_TEST_CREATE
  SpeedTestCreate=32,
  // SPEED_TEST_DELETE
  SpeedTestDelete=33,
  // REQUEST_LAST_MESSAGES
  RequestLastMessages=34,
}
