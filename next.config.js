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
