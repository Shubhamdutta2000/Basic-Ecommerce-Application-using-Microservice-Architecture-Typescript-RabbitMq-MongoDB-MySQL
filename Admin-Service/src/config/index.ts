import * as dotenv from "dotenv";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config();

export default {
  port: process.env.PORT || 5001,
  rabbitmqUrl: process.env.RABBITMQ_URL,
};
