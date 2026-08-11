const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    console.log('===> ', req.body);
    cb(null, 'BS_' + req.user.businessId + '_inventory' + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
