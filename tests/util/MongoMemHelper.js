const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const winston = require("winston");
const console = new winston.transports.Console();
winston.add(console);

// May require additional time for downloading MongoDB binaries
jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000;
let mongoServer;

/*
  These are sort of integration tests.  The monogo memory server
  allows you to run tests against a real db very quickly.

  https://github.com/nodkz/mongodb-memory-server
*/

const MongoMemHelper = class {
  constructor() {}

  async startDB() {
    mongoServer = new MongoMemoryServer();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri, {}, (err) => {
      if (err) console.error(err);
    });
    return;
  }

  async stopDB() {
    await mongoose.disconnect();
    await mongoServer.stop();
    return;
  }

  /**
   * Delete all collections and indexes
   */
  async cleanup() {
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    return Promise.all(
      collections
        .map(({ name }) => name)
        .map((collection) =>
          mongoose.connection.db.collection(collection).drop()
        )
    );
    return;
  }
};

module.exports = { MongoMemHelper: MongoMemHelper };
