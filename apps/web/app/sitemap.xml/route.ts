const BASE = "https://getboss.ai";
const LASTMOD = "2026-07-04";

const PAGES = [
  { url: "/", priority: "1.0", changefreq: "weekly" },
  { url: "/auth/sign-up", priority: "0.9", changefreq: "monthly" },
  { url: "/auth/sign-in", priority: "0.6", changefreq: "monthly" },
  { url: "/waitlist", priority: "0.8", changefreq: "monthly" },
];

export function GET() {
  const urls = PAGES.map(
    (p) => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${LASTMOD}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  ).join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`,
    { headers: { "Content-Type": "application/xml" } }
  );
}
