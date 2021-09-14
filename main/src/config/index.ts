import * as dotenv from "dotenv";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config();

const MONGO_URL = process.env.MONGODB_URI;

export default {
  databaseURL: MONGO_URL,
  port: process.env.PORT || 5001,
  rabbitmqUrl: process.env.RABBITMQ_URL,
};
