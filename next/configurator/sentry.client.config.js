// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT =
  process.env.ENVIRONMENT || process.env.NEXT_PUBLIC_ENVIRONMENT || 'sbx';
const TRACE_SAMPLE_RATE =
  process.env.TRACE_SAMPLE_RATE ||
  process.env.NEXT_PUBLIC_TRACE_SAMPLE_RATE ||
  0.0;
const PROFILE_RATE =
  process.env.PROFILE_RATE || process.env.NEXT_PUBLIC_PROFILE_RATE || 0.0;
const REPLAY_RATE =
  process.env.REPLAY_RATE || process.env.NEXT_PUBLIC_REPLAY_RATE || 0.0;
const RELEASE =
  process.env.RELEASE || process.env.NEXT_PUBLIC_RELEASE || '0.0.0';

Sentry.init({
  dsn:
    SENTRY_DSN,
  environment: ENVIRONMENT,
  release: RELEASE,
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: TRACE_SAMPLE_RATE,
  // We always want to replay errors
  replaysOnErrorSampleRate: 1.0,
  profilesSampleRate: PROFILE_RATE,
  replaysSessionSampleRate: REPLAY_RATE,
  integrations: [
    new Sentry.Integrations.Breadcrumbs({
      console: false,
    }),
    new Sentry.Replay({
      // Make sure we never leak any sensitive data
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  // ...
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});
