import { randomUUID } from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({});

const BUCKET = process.env.MEDIA_BUCKET;

export const presignUpload = async (req, res) => {
  try {
    if (!BUCKET) {
      return res.status(503).json({
        success: false,
        message: "Media uploads are not configured (MEDIA_BUCKET missing).",
      });
    }

    const { contentType, prefix = "uploads" } = req.body || {};
    if (!contentType || typeof contentType !== "string") {
      return res.status(400).json({
        success: false,
        message: "contentType is required.",
      });
    }

    const ext =
      contentType === "image/jpeg"
        ? "jpg"
        : contentType === "image/png"
          ? "png"
          : contentType === "audio/webm"
            ? "webm"
            : contentType === "audio/mpeg"
              ? "mp3"
              : "bin";

    const key = `${prefix}/${req.user._id}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return res.status(200).json({
      success: true,
      uploadUrl,
      key,
      bucket: BUCKET,
    });
  } catch (error) {
    console.error("presignUpload:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create upload URL.",
    });
  }
};
