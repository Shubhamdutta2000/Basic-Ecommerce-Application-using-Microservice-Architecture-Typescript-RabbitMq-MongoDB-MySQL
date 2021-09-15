const secret = require('./dist/config').default
const config = {
  type: "mongodb",
  url: secret.databaseURL,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  entities: ["dist/entity/*.js"],
  logging: true,
  synchronize: true,
  cli: { entitiesDir: "src/entity" }
}
module.exports = config;