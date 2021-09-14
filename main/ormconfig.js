const secret = require('./dist/config').default
const config = {
  type: "mongodb",
  url: secret.databaseURL,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  entities: ["dist/entities/*.js"],
  logging: true,
  synchronize: true,
  cli: { entitiesDir: "src/entities" }
}
module.exports = config;