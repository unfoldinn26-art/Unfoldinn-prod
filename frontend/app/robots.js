export default function robots() {
  const commonDisallows = [
    '/admin',
    '/admin/',
    '/api',
    '/api/',
    '/book/status',
    '/dashboard',
    '/onboarding',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: commonDisallows,
      },
      // Google & Google Gemini AI Overviews
      {
        userAgent: ['Googlebot', 'Google-Extended', 'GoogleOther'],
        allow: '/',
        disallow: commonDisallows,
      },
      // Microsoft Bing & Copilot
      {
        userAgent: ['Bingbot', 'msnbot'],
        allow: '/',
        disallow: commonDisallows,
      },
      // OpenAI (ChatGPT Search, GPTBot, SearchGPT)
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User'],
        allow: '/',
        disallow: commonDisallows,
      },
      // Anthropic Claude
      {
        userAgent: ['ClaudeBot', 'anthropic-ai'],
        allow: '/',
        disallow: commonDisallows,
      },
      // Perplexity AI
      {
        userAgent: ['PerplexityBot'],
        allow: '/',
        disallow: commonDisallows,
      },
      // Apple Intelligence
      {
        userAgent: ['Applebot', 'Applebot-Extended'],
        allow: '/',
        disallow: commonDisallows,
      },
      // Cohere AI
      {
        userAgent: ['cohere-ai'],
        allow: '/',
        disallow: commonDisallows,
      },
    ],
    sitemap: 'https://www.unfoldinn.com/sitemap.xml',
    host: 'https://www.unfoldinn.com',
  };
}
