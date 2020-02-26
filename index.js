const express = require('express');
const config = require('config');
const mongoose = require('mongoose');

const index = express();

const PORT = config.get('port') || 5000;


async function start() {
  try {
    await mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
    index.listen(5000, () => console.log(`App has been started ${PORT}...`));
  } catch (e) {
    console.log('Server Error', e.message)
    process.exit(1);
  }
}

start();


