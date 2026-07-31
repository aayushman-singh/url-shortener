require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(routes.router);

async function start() {
  await db.init();
  app.listen(PORT, () => {
    console.log(`url-shortener listening on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { app, start };
