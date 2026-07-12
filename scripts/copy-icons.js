import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_IMAGE = "C:/Users/gorre/.gemini/antigravity/brain/819cdd6f-c143-4a8a-a48c-99f6a36b0d3c/fpo_logo_1783845046455.png";
const PUBLIC_DIR = path.join(__dirname, "../public");

const DESTINATIONS = [
  "favicon-16.png",
  "favicon-32.png",
  "apple-touch-icon.png",
  "android-chrome-192.png",
  "android-chrome-512.png",
  "favicon.ico"
];

const copyIcons = () => {
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error(`Source image not found: ${SOURCE_IMAGE}`);
    return;
  }

  DESTINATIONS.forEach((dest) => {
    const destPath = path.join(PUBLIC_DIR, dest);
    fs.copyFileSync(SOURCE_IMAGE, destPath);
    console.log(`Copied icon successfully to public/${dest}`);
  });
};

copyIcons();
