const express = require('express');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', protect, admin, upload.single('image'), async (req, res) => {
    try {
        console.log('Upload Request Received');
        console.log('File:', req.file);
        console.log('Body:', req.body);

        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert buffer to base64
        console.log('Converting buffer to base64...');
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        console.log('Uploading to Cloudinary...');
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'gojra_emart',
        });

        console.log('Cloudinary Upload Success:', result.secure_url);
        res.json({ url: result.secure_url });
    } catch (error) {
        console.error('Upload Error Details:', error);
        res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
});

module.exports = router;
