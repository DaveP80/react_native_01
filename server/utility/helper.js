async function handleUpload(file, cloudinary) {
    const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto', // Automatically detect image/video
            folder: 'my-app-media',
            transformation: [
              { width: 800, height: 600, crop: 'limit' }, // Resize images
              { quality: 'auto' } // Auto-optimize quality
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });
      return result;
  }

export { handleUpload };