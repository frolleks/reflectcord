/* eslint-disable no-bitwise */

export const ClientCapabilities = {
  /**
   * Controls if notes will be sent during READY
   * or fetched by the client via the notes route
   *
   * Changes:
   *
   * notes field will no longer be sent by READY
  */
  LazyUserNotes: 1 << 0,
  /**
   * TODO: does anybody actually know what this is for?
  */
  NoAffineUserIds: 1 << 1,
  /**
   * Client supports versioned read states
   *
   * Sent while true: {
   *  entries: ReadStateEntry[],
   *  partial: boolean,
   *  version: number
   * }
   *
   * Sent while false: ReadStateEntry[]
  */
  VersionedReadStates: 1 << 2,
  /**
   * Client supports versioned read states
   *
   * Sent while true: {
   *  entries: GuildSettingEntry[],
   *  partial: boolean,
   *  version: number
   * }
   *
   * Sent while false: GuildSettingEntry[]
  */
  VersionedUserGuildSettings: 1 << 3,
  /**
   * Client supports user object deduplication
   *
   * Changes:
   *
   * presences field is no longer sent by READY
   *
   * merged_presences, merged_members, and users fields become present
   * in READY payload
   *
   * NOTES:
   * Discord is very inconsistent with deduplicating user objects -
   * sometimes members will have a full user field, other times they'll
   * just have an id field. This could possibly be an optimization
   * by the gateway that checks if the client has already received the
   * user object, and if it has, to only send a user object with the id
   * field.
   * This also appears to be the case for PRESENCE_UPDATE
  */
  DeduplicateUserObjects: 1 << 4,
  /**
   * Changes:
   *
   * Adds a guild_hashes property to guild objects
   * This property doesn't seem to be required by any of the official
   * clients, however (tests needed).
  */
  PrioritizedReadyPayload: 1 << 5,
  MultipleGuildExperimentPopulations: 1 << 6,
  /**
   * Client can support NonChannelReadState objects
  */
  NonChannelReadStates: 1 << 7,
  /**
   * Client supports getting a new auth_token dynamically
  */
  AuthTokenRefresh: 1 << 8,
  /**
   * Client fully supports settings protocol buffers, and we can
   * ignore JSON user settings from being sent.
   *
   * Changes:
   * user_settings field is no longer sent by READY
   * USER_SETTINGS_UPDATE is no longer dispatched
   *
   * NOTES:
   * Discord emits settings proto events no matter what, even
   * if the client can't support them.
  */
  UserSettingsProto: 1 << 9,
  /**
   * Client wants to receive newer DTOs
   *
   * Known changes when true:
   * New Guild DTOs are sent
   * Typing indicators are sent procedurally
  */
  ClientStateV2: 1 << 10,
  /**
   * Client can support PASSIVE_GUILD_UPDATE events
  */
  PassiveGuildUpdate: 1 << 11,
};

export interface CapabilitiesObject {
  LazyUserNotes: boolean,
  NoAffineUserIds: boolean,
  VersionedReadStates: boolean,
  VersionedUserGuildSettings: boolean,
  DeduplicateUserObjects: boolean,
  PrioritizedReadyPayload: boolean,
  MultipleGuildExperimentPopulations: boolean,
  NonChannelReadStates: boolean,
  AuthTokenRefresh: boolean,
  UserSettingsProto: boolean,
  ClientStateV2: boolean,
  PassiveGuildUpdate: boolean,
}

export const DefaultCapabilities: CapabilitiesObject = {
  LazyUserNotes: false,
  NoAffineUserIds: true,
  VersionedReadStates: false,
  VersionedUserGuildSettings: false,
  DeduplicateUserObjects: false,
  PrioritizedReadyPayload: false,
  MultipleGuildExperimentPopulations: false,
  NonChannelReadStates: false,
  AuthTokenRefresh: false,
  UserSettingsProto: false,
  ClientStateV2: false,
  PassiveGuildUpdate: false,
};

export function IdentifyCapabilities(capabilties: number): CapabilitiesObject {
  return {
    LazyUserNotes: !!(capabilties & ClientCapabilities.LazyUserNotes),
    NoAffineUserIds: !!(capabilties & ClientCapabilities.NoAffineUserIds),
    VersionedReadStates: !!(capabilties & ClientCapabilities.VersionedReadStates),
    VersionedUserGuildSettings: !!(capabilties & ClientCapabilities.VersionedUserGuildSettings),
    DeduplicateUserObjects: !!(capabilties & ClientCapabilities.DeduplicateUserObjects),
    PrioritizedReadyPayload: !!(capabilties & ClientCapabilities.PrioritizedReadyPayload),
    // eslint-disable-next-line max-len
    MultipleGuildExperimentPopulations: !!(capabilties & ClientCapabilities.MultipleGuildExperimentPopulations),
    NonChannelReadStates: !!(capabilties & ClientCapabilities.NonChannelReadStates),
    AuthTokenRefresh: !!(capabilties & ClientCapabilities.AuthTokenRefresh),
    UserSettingsProto: !!(capabilties & ClientCapabilities.UserSettingsProto),
    ClientStateV2: !!(capabilties & ClientCapabilities.ClientStateV2),
    PassiveGuildUpdate: !!(capabilties & ClientCapabilities.PassiveGuildUpdate),
  };
}
