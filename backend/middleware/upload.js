const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'buysell-nigeria',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

module.exports = upload;
