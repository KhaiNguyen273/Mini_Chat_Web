import cloudinary from "../config/cloudinary";

export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "raw" | "auto" = "auto"
): Promise<{ url: string; publicId: string; bytes: number; format: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );
    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string) => {
  await cloudinary.uploader.destroy(publicId);
};