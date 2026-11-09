import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Express Spring Security',
  description: 'Enterprise-grade Spring Security architecture for Express & TypeScript',
  base: '/express-spring-security/',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/express-spring-security/croppedlogo.png' }]
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
      message: 'Released under the ISC License.',
      copyright: 'Copyright © 2026 Eyob Hailu'
    },

    search: {
      provider: 'local'
    }
  }
});
