const path = require('node:path');
const multer  = require('multer');

// 1. Configurar dónde y cómo se guardan los archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Asegúrate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    console.log('===> ', req.body)
    cb(null, 'BS_'+req.user.business_id + '_inventory' + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


module.exports = upload;