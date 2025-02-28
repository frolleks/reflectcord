/* eslint-disable camelcase */
import { Resource } from "express-automatic-routes";
import {
  createSettingsSyncPOST,
  SettingsKeys, settingsProtoToJSON, settingsToProtoBuf, Status, UserSettings,
} from "@reflectcord/common/models";
import { HTTPError, Logger } from "@reflectcord/common/utils";
import protobuf from "protobufjs";
import { join } from "path";

const settingsProtoFile = join(__dirname, "../../../../../../../resources/FrecencyUserSettings.proto");

export default () => <Resource> {
  get: async (req, res) => {
    switch (req.params.protoId!) {
      case "1": {
        const rvSettings = await res.rvAPI.post("/sync/settings/fetch", {
          keys: SettingsKeys,
        });

        const settings = await UserSettings.from_quark(rvSettings);

        const proto = await settingsToProtoBuf(settings);

        res.send(Buffer.from(proto).toString("base64"));

        break;
      }
      case "2": {
        const rvSettings = await res.rvAPI.post("/sync/settings/fetch", {
          keys: ["frecency_user_settings"],
        });

        res.json(rvSettings["frecency_user_settings"]?.[1] ?? "");

        break;
      }
      default: {
        res.sendStatus(500);
        break;
      }
    }
  },
  patch: async (req, res) => {
    const { settings } = req.body;
    const { protoId } = req.params;

    if (!settings) throw new HTTPError("Invalid settings");

    const settingsData = Buffer.from(settings, "base64");

    const currentSettings = await res.rvAPI.post("/sync/settings/fetch", {
      keys: SettingsKeys,
    });

    const settingsJSON = await settingsProtoToJSON(
      settingsData,
      await UserSettings.from_quark(currentSettings),
    );
    const user = await res.rvAPIWrapper.users.getSelf(true);

    switch (protoId) {
      case "1": {
        const revoltSettings = await UserSettings.to_quark(settingsJSON);

        const discordSettings = await UserSettings.from_quark(revoltSettings, {
          status: user.status ? (await Status.from_quark(user.status, {
            online: user.online,
          })).status ?? null : null,
        });
        const updatedProto = await settingsToProtoBuf(discordSettings, {
          customStatusText: user.status?.text,
        });
        const settingsPOST = createSettingsSyncPOST(revoltSettings);

        await res.rvAPI.post("/sync/settings/set", settingsPOST);

        res.json({
          settings: Buffer.from(updatedProto).toString("base64"),
        });
        break;
      }
      case "2": {
        const root = await protobuf.load(settingsProtoFile);

        const frecencySettings = root.lookupType("FrecencyUserSettings");

        frecencySettings.verify(settingsData);

        await res.rvAPI.post("/sync/settings/set", createSettingsSyncPOST({
          frecency_user_settings: [Date.now(), settings],
        }));

        res.json({
          settings,
        });

        break;
      }
      default: {
        Logger.warn(`unhandled proto ${protoId}`);
        res.sendStatus(500);
      }
    }
  },
};
