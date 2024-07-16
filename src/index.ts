const ParseDashboard = require("parse-dashboard");

import express from "express";
import { ParseServer } from "parse-server";
import path from "path";
import http from "http";
import * as dotenv from "dotenv";

dotenv.config();
const mountPath = "/parse";

/**
 * Validates the presence of required environment variables.
 * @throws {Error} If any of the required environment variables are missing.
 */
function validateEnvVariables() {
  const requiredEnvVars = [
    "PARSE_DATABASE_URI",
    "PARSE_APP_ID",
    "PARSE_MASTER_KEY",
    "PARSE_JAVASCRIPT_KEY",
    "PARSE_SERVER_URL",
    "PARSE_PORT_NUMBER",
    "PARSE_CLOUD_CODE_MAIN",
    "PARSE_DASHBOARD_USER",
    "PARSE_DASHBOARD_PASS",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Environment variables missing: ${missingEnvVars.join(
        ", "
      )}. Use .env file or set them via the cloud.`
    );
  }
}
validateEnvVariables();

export const config = {
  databaseURI:
    process.env.PARSE_DATABASE_URI || "mongodb://localhost:27017/app",
  cloud: process.env.PARSE_CLOUD_CODE_MAIN || __dirname + "/cloud/main.js",
  appId: process.env.PARSE_APP_ID,
  masterKey: process.env.PARSE_MASTER_KEY,
  javaScriptKey: process.env.PARSE_JAVASCRIPT_KEY,
  serverURL: process.env.PARSE_SERVER_URL || "http://localhost:1337/parse",
  liveQuery: {
    classNames: [],
  },
};

const dashboard_config = () => {
  return {
    apps: [
      {
        appName: process.env.PARSE_APP_NAME,
        serverURL: process.env.PARSE_SERVER_URL,
        appId: process.env.PARSE_APP_ID,
        masterKey: process.env.PARSE_MASTER_KEY,
      },
    ],
    users: [
      {
        user: process.env.PARSE_DASHBOARD_USER,
        pass: process.env.PARSE_DASHBOARD_PASS,
      },
    ],
    useEncryptedPasswords: true,
  };
};

(async () => {
  const server = new ParseServer({
    databaseURI: process.env.PARSE_DATABASE_URI,
    // allowClientClassCreation: false,
    appId: process.env.PARSE_APP_ID,
    masterKey: process.env.PARSE_MASTER_KEY,
    serverURL: process.env.PARSE_SERVER_URL,
    javascriptKey: process.env.PARSE_JAVASCRIPT_KEY,
    cloud: process.env.CLOUD_CODE_MAIN || "./src/cloud/main.ts",
    defaultACL: { currentUser: { read: true, write: true } },

    liveQuery: {
      classNames: [],
    },
  });
  const dashboard = new ParseDashboard(dashboard_config());
  // Client-keys like the javascript key or the .NET key are not necessary with parse-server
  // If you wish you require them, you can set them as options in the initialization above:
  // javascriptKey, restAPIKey, dotNetKey, clientKey
  const app = express();
  app.set("trust proxy", true);

  // Serve static assets from the /public folder
  app.use("/public", express.static(path.join(__dirname, "/public")));

  // Serve the Parse API on the /parse URL prefix
  await server.start();
  app.use(mountPath, server.app);
  app.use("/dashboard", dashboard);

  // Parse Server plays nicely with the rest of your web routes
  app.get("/", function (req, res) {
    res.status(200).send("This is the base url");
  });

  // There will be a test page available on the /test path of your server url
  // Remove this before launching your app
  app.get("/test", function (req, res) {
    res.sendFile(path.join(__dirname, "/public/test.html"));
  });

  const port = process.env.PARSE_PORT_NUMBER || 1337;
  const httpServer = http.createServer(app);
  httpServer.listen(port, function () {
    console.log(`Server is running on ${process.env.PARSE_SERVER_URL}.`);
  });
  // This will enable the Live Query real-time server
  await ParseServer.createLiveQueryServer(httpServer);
})().catch((err) => console.error(err));
