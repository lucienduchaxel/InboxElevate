/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    typescript: {
        // Ignore type errors in the `src` directory
        ignoreBuildErrors: true,
    },
    eslint: {
        // Ignore lint errors in the `src` directory
        ignoreDuringBuilds: true,
    },
};

export default config;
