import { join } from "path";
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from "fs";
import { FastifyRequest as Request, FastifyReply as Response } from "fastify";
import FormData from "form-data";
import axios, { isAxiosError } from "axios";
import fileType from "file-type";
import Ffmpeg from "fluent-ffmpeg";
import { AutumnURL, getAutumnConfig } from "@reflectcord/common/constants";
import { HTTPError, Logger } from "@reflectcord/common/utils";
import { hashFromSnowflake } from "@reflectcord/common/models";
import sharp from "sharp";

const DisallowedTypes = ["text/html", "text/mhtml", "multipart/related", "application/xhtml+xml"];

export type ImageType = "attachments" | "avatars" | "icons" | "backgrounds" | "emojis" | "banners";

export const imageCacheDir = join(__dirname, "../../../cache/autumn");

if (!existsSync(imageCacheDir)) {
  mkdirSync(imageCacheDir, {
    recursive: true,
  });
}

export async function downloadImage(type: ImageType, id: string) {
  const rvURL = `${AutumnURL}/${type}/${id}`;
  const imgTypeCacheDir = join(imageCacheDir, type);
  const imgDir = join(imgTypeCacheDir, id);

  if (!existsSync(imgTypeCacheDir)) mkdirSync(imgTypeCacheDir);

  if (!existsSync(imgDir)) {
    try {
      Logger.log(`Downloading uncached ${type} ${id}`);
      const res: Buffer = (await axios.get(rvURL, { responseType: "arraybuffer" })).data;
      writeFileSync(imgDir, res);
      return res;
    } catch (e) {
      if (isAxiosError(e)) {
        if (e.code === "404") {
          throw new HTTPError("Invalid image!", 404);
        }
      }
    }
  }

  const cachedImage = readFileSync(imgDir);

  return cachedImage;
}

export type revoltAttachmentResponse = {
  id: string;
}

export async function getMimeType(file: Buffer) {
  const fallback = "application/octet-stream";

  const bufferType = await fileType.fromBuffer(file);

  let mimeType = bufferType?.mime ?? fallback;

  if (DisallowedTypes.includes(mimeType)) {
    mimeType = fallback;
  }

  return mimeType;
}

export async function generateVideoThumbnail(video: Buffer) {

}

export async function uploadFile(
  type: ImageType,
  file: { name: string; file: Buffer },
  dataType?: string,
) {
  const contentType = dataType ?? await getMimeType(file.file)
    .catch((e) => {
      Logger.error(`mime type failure: ${e}`);
      return "application/octet-stream";
    });
  const data = new FormData();
  data.append("file", file.file, { filename: file.name, contentType });

  if (file.file.length > (await getAutumnConfig()).tags.attachments.max_size) throw new HTTPError("File is too large!", 413);

  const response = await (axios.post<revoltAttachmentResponse>(
    `${AutumnURL}/${type}`,
    data,
    { headers: data.getHeaders() },
  ));

  return response.data.id;
}

export async function uploadBase64File(
  type: ImageType,
  file: { name?: string; file: string },
  contentType?: string,
) {
  const dataParsed = file.file.split("base64,").pop();
  if (!dataParsed) throw new Error("Invalid img data");
  const imgData = Buffer.from(dataParsed, "base64");
  const dataType = await getMimeType(imgData);
  const id = await uploadFile(type, {
    name: file.name ?? "image.png",
    file: imgData,
  }, contentType ?? dataType);

  return id;
}

export async function handleFile(path: ImageType, body?: string) {
  if (!body || !body.startsWith("data:")) return undefined;
  try {
    const mimetype = body.split(":")[1]?.split(";")[0];
    const buffer = Buffer.from(body.split(",")[1]!, "base64");

    const id = await uploadFile(path, { file: buffer, name: "banner" }, mimetype ?? "application/octet-stream");
    return id;
  } catch (error) {
    console.error(error);
    throw new HTTPError(`Invalid ${path}`);
  }
}

export type ImageQuery = Request<
  {
    Querystring?: {
      format?: string,
      upload_id?: string,
      size?: string,
      width?: string,
      height?: string,
    },
    Params?: {
      app_id?: string,
      avatar_id?: string,
      banner_id?: string,
      icon_id?: string,
      id?: string,
      file_name?: string,
      user_id?: string,
      imageId?: string,
      splashId?: string,
      gifId?: string,
      guildId?: string,
      iconId?: string,
      avatarId?: string,
      background_id?: string,
    },
  }
>;

export async function handleImgRequest(
  req: ImageQuery,
  res: Response,
  type: ImageType,
  id?: string,
  skipConversion?: boolean,
) {
  if (!id) return res.status(404).send();

  // Discord adds .png to the end, for some reason.
  const realId = skipConversion ? id.replace(/\.[^/.]+$/, "") : await hashFromSnowflake(id.replace(/\.[^/.]+$/, ""));
  if (!realId) return res.status(500).send();

  const avatarData = await downloadImage(type, realId);
  if (!avatarData) return res.status(404).send();

  const mimeType = await getMimeType(avatarData);

  if (req.query?.format === "jpeg") {
    if (mimeType.startsWith("video")) {
      const thumbnailDir = join(imageCacheDir, "thumbnails", type);
      const thumbnailFile = join(thumbnailDir, realId, "tn.png");
      if (!existsSync(thumbnailDir)) mkdirSync(thumbnailDir, { recursive: true });

      if (existsSync(thumbnailFile)) {
        const tbData = readFileSync(thumbnailFile);

        res.header("Content-Type", await getMimeType(tbData));
        res.header("Cache-Control", "public, max-age=31536000");

        return res.send(tbData);
      }

      return Ffmpeg(join(imageCacheDir, type, realId))
        .on("end", async () => {
          const tbData = readFileSync(thumbnailFile);

          res.header("Content-Type", await getMimeType(tbData));
          res.header("Cache-Control", "public, max-age=31536000");

          return res.send(tbData);
        })
        .takeScreenshots({
          count: 1,
          filename: "tn.png",
          timemarks: ["0"],
        }, join(thumbnailDir, realId));
    }
  }

  res.header("Content-Type", mimeType);
  res.header("Cache-Control", "public, max-age=31536000");

  if (mimeType.startsWith("image")) {
    if (typeof req.query?.size === "string") {
      const size = parseInt(req.query.size, 10);

      const image = sharp(avatarData, {
        animated: mimeType === "image/gif",
      }).resize(size);

      const resized = await image.toBuffer();

      return res.send(resized);
    }
    if (typeof req.query?.width === "string" && typeof req.query.height === "string") {
      const width = parseInt(req.query.width, 10);
      const height = parseInt(req.query.height, 10);

      const image = sharp(avatarData, {
        animated: mimeType === "image/gif",
      }).resize(width, height);

      const resized = await image.toBuffer();

      return res.send(resized);
    }
  }

  return res.send(avatarData);
}

export async function handleImgUpload(req: Request, res: Response, type: ImageType) {}
