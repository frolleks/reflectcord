import {
  ResponseLogin as RevoltLoginResponse,
  DataLogin as RevoltDataLogin,
  SessionInfo,
} from "revolt-api";
import { decodeTime } from "ulid";
import { QuarkConversion } from "../../QuarkConversion";
import { LoginSchema, MFALoginSchema, UserSession } from "../../../sparkle";
import { toCompatibleISO } from "../../../utils/date";

export type APILoginResponse = {
  token: string | null,
  settings: any,
  ticket?: string | undefined, // MFA ticket
  sms?: boolean | undefined,
  mfa?: boolean | undefined,
}

export const ResponseLogin: QuarkConversion<RevoltLoginResponse, APILoginResponse> = {
  async to_quark(login) {
    const { token } = login;

    return {
      token: token ?? "",
      result: "Success",
      user_id: "", // FIXME,
      name: "",
      _id: "",
    };
  },

  async from_quark(login) {
    const isMFA = login.result === "MFA";

    if (isMFA) {
      return {
        token: null,
        settings: undefined,
        ticket: login.ticket,
        sms: false,
        mfa: true,
      };
    }

    if (login.result !== "Success") {
      return {
        token: null,
        settings: undefined,
      };
    }

    return {
      token: login.token,
      settings: undefined,
    };
  },
};

export const DataMFALogin: QuarkConversion<RevoltDataLogin, MFALoginSchema> = {
  async to_quark(data) {
    return {
      mfa_response: {
        totp_code: data.code,
      },
      mfa_ticket: data.ticket,
    };
  },

  async from_quark(data) {
    if (!("mfa_response" in data && data.mfa_response && "totp_code" in data.mfa_response)) throw new Error("Invalid login type");

    return {
      code: data.mfa_response.totp_code,
      ticket: data.mfa_ticket,
    };
  },
};

export const DataLogin: QuarkConversion<RevoltDataLogin, LoginSchema, {
  friendly_name?: string | null | undefined,
}> = {
  async to_quark(data, extra) {
    const rvData = {
      email: data.login ?? data.email,
      password: data.password,
      // captcha: data.captcha_key ?? null,
      friendly_name: data.login_source ?? extra?.friendly_name ?? null,
    };

    return rvData;
  },

  async from_quark(data) {
    const isMFA = ("mfa_ticket" in data);

    return {
      login: isMFA ? "fixme" : data.email,
      password: isMFA ? "fixme" : data.password,
      // captcha_key: isMFA ? "fixme" : data.captcha ?? "fixme",
    };
  },
};

export const Session: QuarkConversion<SessionInfo, UserSession> = {
  async to_quark(session) {
    return {
      _id: session.id_hash,
      name: session.client_info.os,
    };
  },

  async from_quark(session) {
    const { _id } = session;

    return {
      id_hash: _id,
      approx_last_used_time: toCompatibleISO(new Date(decodeTime(_id)).toISOString()),
      client_info: {
        os: session.name,
        platform: "web",
        location: "",
      },
    };
  },
};
