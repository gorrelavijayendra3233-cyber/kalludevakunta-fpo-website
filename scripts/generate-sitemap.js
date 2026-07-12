import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = "https://kalludevakuntafpcl.in";

const PAGES = [
  { path: "", changefreq: "daily", priority: "1.0" },
  { path: "/about", changefreq: "weekly", priority: "0.8" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/gallery", changefreq: "weekly", priority: "0.7" },
  { path: "/contact", changefreq: "weekly", priority: "0.8" },
  { path: "/farmer-login", changefreq: "monthly", priority: "0.6" },
  { path: "/farmer-register", changefreq: "monthly", priority: "0.6" }
];

const generateSitemap = () => {
  const dateStr = new Date().toISOString().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  PAGES.forEach((page) => {
    xml += `  <url>\n`;
    xml += `    <loc>${DOMAIN}${page.path}</loc>\n`;
    xml += `    <lastmod>${dateStr}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  // Write to public folder
  const publicPath = path.join(__dirname, "../public/sitemap.xml");
  fs.writeFileSync(publicPath, xml, "utf8");
  console.log(`Sitemap generated successfully in public/sitemap.xml`);

  // Write to dist folder (if exists)
  const distPath = path.join(__dirname, "../dist/sitemap.xml");
  const distDir = path.dirname(distPath);
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(distPath, xml, "utf8");
    console.log(`Sitemap copied successfully to dist/sitemap.xml`);
  }
};

generateSitemap();
