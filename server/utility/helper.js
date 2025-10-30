//experimental server side cloudinary uploading.
async function handleUpload(file, cloudinary) {
    const res = await cloudinary.uploader.upload(file, {
        resource_type: "auto",
      });
      return res;
  }

module.exports = { handleUpload };