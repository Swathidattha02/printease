const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const printController = require('../controllers/printController');

const uploadsDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// POST /api/prints/upload
router.post('/upload', upload.single('file'), printController.handleFileUpload);

module.exports = router;
