/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Stops the site from being embedded in an iframe on another domain —
  // a common building block of clickjacking attacks.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stops browsers from guessing content types in a way that can be abused.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limits how much referrer info leaks to other sites when someone clicks
  // an outbound link (e.g. the WhatsApp button).
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disables browser features this app never uses, so they can't be abused
  // even if something else on the page tries to invoke them.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
