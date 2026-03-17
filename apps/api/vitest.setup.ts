import { config } from "dotenv";
import { resolve } from "path";

// Load local .env first (has DATABASE_URL), then root .env
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, "../../.env") });
