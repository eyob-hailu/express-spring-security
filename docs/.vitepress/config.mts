import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Express Spring Security',
  description: 'Enterprise-grade Spring Security architecture for Express & TypeScript',
  base: '/express-spring-security/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://eyob-hailu.github.io',
    transformItems(items) {
      return items.map((item) => ({
        ...item,
        url: item.url.startsWith('express-spring-security/')
          ? item.url
          : `express-spring-security/${item.url}`
      }));
    }
  },

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/express-spring-security/croppedlogo.png' }],
    ['meta', { name: 'keywords', content: 'express, spring-security, rbac, typescript, jwt, authentication, middleware, decorators, passport-alternative, enterprise, security' }],
    ['meta', { name: 'author', content: 'Eyob Hailu' }],

    // OpenGraph (Social & Search Previews)
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Express Spring Security — Enterprise Security for Express & TypeScript' }],
    ['meta', { property: 'og:description', content: 'Enterprise-grade authentication, fluent URL authorization, and declarative method security for modern Node.js.' }],
    ['meta', { property: 'og:image', content: 'https://eyob-hailu.github.io/express-spring-security/logo.jpg' }],
    ['meta', { property: 'og:url', content: 'https://eyob-hailu.github.io/express-spring-security/' }],

    // Twitter Cards
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Express Spring Security' }],
    ['meta', { name: 'twitter:description', content: 'Enterprise-grade Spring Security 6 architecture for Express & TypeScript applications.' }],
    ['meta', { name: 'twitter:image', content: 'https://eyob-hailu.github.io/express-spring-security/logo.jpg' }],

    // Google Tag
    [
      'script',
      { async: '', src: 'https://www.googletagmanager.com/gtm.js?id=GTM-5V7HRDBH' }
    ],
    [
      'script',
      {},
      `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'GTM-5V7HRDBH');`
    ],

    // JSON-LD Structured Data for Google Rich Snippets
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Express Spring Security',
        operatingSystem: 'Node.js',
        applicationCategory: 'DeveloperApplication',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        author: {
          '@type': 'Person',
          name: 'Eyob Hailu',
          url: 'https://github.com/eyob-hailu'
        },
        description: 'Enterprise-grade Spring Security architecture for Express & TypeScript applications.'
      })
    ]
  ],

  themeConfig: {
    siteTitle: 'Express Spring Security',
    logo: '/croppedlogo.png',

    nav: [
      { text: 'Guide', link: '/guide/what-is-it' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'Integrations', link: '/integrations/prisma-database' },
      { text: 'API Reference', link: '/reference/api' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/eyob-hailu/express-spring-security/releases' },
          { text: 'npm Package', link: 'https://www.npmjs.com/package/express-spring-security' }
        ]
      }
    ],

    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          { text: 'What is it?', link: '/guide/what-is-it' },
          { text: 'Quick Start (5 Mins)', link: '/guide/getting-started' },
          { text: 'Why not Passport / NestJS?', link: '/guide/comparison' }
        ]
      },
      {
        text: 'Architecture & Features',
        collapsed: false,
        items: [
          { text: 'Request Lifecycle Architecture', link: '/guide/architecture' },
          { text: 'SecurityFilterChain Pipeline', link: '/guide/security-filter-chain' },
          { text: 'SecurityContextHolder (Ambient Context)', link: '/guide/ambient-context' },
          { text: 'Method Security (@PreAuthorize)', link: '/guide/method-security' },
          { text: 'Ant Path Matching Rules', link: '/guide/ant-path-matching' },
          { text: 'Exception Handling (401 vs 403)', link: '/guide/exception-handling' }
        ]
      },
      {
        text: 'Integration Guides',
        collapsed: false,
        items: [
          { text: 'Database RBAC (Prisma / TypeORM)', link: '/integrations/prisma-database' },
          { text: 'Enterprise JWKS (Auth0 / Okta / Keycloak)', link: '/integrations/auth0-jwks' },
          { text: 'Testing Protected Endpoints', link: '/integrations/testing' }
        ]
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'Complete API Reference', link: '/reference/api' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/eyob-hailu/express-spring-security' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Eyob Hailu'
    },

    search: {
      provider: 'local'
    }
  }
});
