module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/portfolio'
      ],
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.7 }],
        
        // Performance metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // PWA checks
        'installable-manifest': 'warning',
        'service-worker': 'warning',
        'splash-screen': 'warning',
        'themed-omnibox': 'warning',
        
        // Best practices
        'uses-http2': 'error',
        'uses-responsive-images': 'error',
        'efficient-animated-content': 'error',
        'no-document-write': 'error',
        'uses-optimized-images': 'error',
        'uses-text-compression': 'error',
        'uses-rel-preconnect': 'warning',
        
        // Accessibility
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'link-name': 'error',
        'meta-viewport': 'error',
        
        // SEO
        'meta-description': 'error',
        'robots-txt': 'error',
        'valid-source-maps': 'warning'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      // Server options here
      port: 3000,
      buildDir: './.next'
    },
    wizard: {
      // Chrome flags to help reduce variance in CI
      chromeFlags: '--no-sandbox --headless --disable-gpu --disable-dev-shm-usage'
    }
  },
  budgets: [
    {
      path: '/*',
      timings: [
        {
          metric: 'interactive',
          budget: 3000
        },
        {
          metric: 'first-meaningful-paint',
          budget: 2000
        }
      ],
      resourceSizes: [
        {
          resourceType: 'script',
          budget: 300
        },
        {
          resourceType: 'total',
          budget: 1000
        }
      ],
      resourceCounts: [
        {
          resourceType: 'third-party',
          budget: 10
        }
      ]
    }
  ]
};