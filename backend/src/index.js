import app from "./app.js";
import { config } from "./config.js";
import { setupDatabase } from "./db/setup.js";
import { pingDatabase } from "./db.js";

async function main() {
  await setupDatabase();
  await pingDatabase();
  const server = app.listen(config.port, () => {
    console.log(`API running on port ${config.port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${config.port} is already in use. Close the previous backend process or change PORT in .env.`);
      process.exit(1);
    }

    throw error;
  });
}

main().catch((error) => {
  console.error("Could not start API", error);
  process.exit(1);
});
