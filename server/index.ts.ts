import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Serve built React app
const staticPath = path.resolve(__dirname, "public");
app.use(express.static(staticPath));

// SPA fallback - all routes serve index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticPath, "index.html"));
});

const port = parseInt(process.env.PORT || "3000", 10);

server.listen(port, "0.0.0.0", () => {
  console.log(`Armstrong Gate running on port ${port}`);
});
