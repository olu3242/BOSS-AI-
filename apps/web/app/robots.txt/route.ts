export function GET() {
  return new Response(
    `User-agent: *
Allow: /
Disallow: /auth/
Disallow: /api/
Disallow: /business/
Disallow: /dashboard
Disallow: /businesses
Disallow: /onboarding/

Sitemap: https://getboss.ai/sitemap.xml
`,
    { headers: { "Content-Type": "text/plain" } }
  );
}
