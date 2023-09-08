/** @type {import('next').NextConfig} */

import { withSentryConfig } from '@sentry/nextjs';


const nextConfig = {
    typescript: {
        tsconfigPath: './tsconfig.prod.json'
    },
    output: 'export',
    sentry: {
        // Use `hidden-source-map` rather than `source-map` as the Webpack `devtool`
        // for client-side builds. (This will be the default starting in
        // `@sentry/nextjs` version 8.0.0.) See
        // https://webpack.js.org/configuration/devtool/ and
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#use-hidden-source-map
        // for more information.
        hideSourceMaps: true
    },
    webpack: (config, { isServer }) => {

        config.resolve.alias.fs ='mem-fs';
        config.resolve.alias.path = 'path-browserify';
        return config
    },
};

const sentryWebpackPluginOptions = {
    // Additional config options for the Sentry Webpack plugin. Keep in mind that
    // the following options are set automatically, and overriding them is not
    // recommended:
    //   release, url, org, project, authToken, configFile, stripPrefix,
    //   urlPrefix, include, ignore

    project: process.env.SENTRY_PROJECT,
    org: process.env.SENTRY_ORG,
    release: process.env.SENTRY_RELEASE,

    silent: process.env.NODE_ENV !== 'production'
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options.
};


export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
