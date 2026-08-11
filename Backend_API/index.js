require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const cors = require('cors');

const UPLOADS_DIR = path.join(__dirname, 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({}));
app.use('/api', require('./routes'));

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
    console.log(`Server Running on port ${PORT}`);
});
