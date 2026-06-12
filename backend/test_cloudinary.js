require('dotenv').config();
const cloudinary = require('./utils/cloudinary');

async function testUpload() {
    console.log('Testing Cloudinary Connection...');
    console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

    try {
        // simple 1x1 pixel base64 image
        const dataURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'test_folder',
        });

        console.log('Upload Success!');
        console.log('URL:', result.secure_url);
    } catch (error) {
        console.error('Upload Failed!');
        console.error(error);
    }
}

testUpload();
