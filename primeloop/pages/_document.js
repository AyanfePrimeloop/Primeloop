import { Html, Head, Main, NextScript } from 'next/document';

// Same mark as components/Logo.js, embedded directly as a data URI so no
// separate image file is needed — this becomes the browser tab icon on
// every page automatically.
const FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' rx='44' fill='%231c2340'/%3E%3Ccircle cx='100' cy='100' r='56' fill='none' stroke='%232a335c' stroke-width='16'/%3E%3Ccircle cx='100' cy='100' r='56' fill='none' stroke='%23e0632b' stroke-width='16' stroke-linecap='round' stroke-dasharray='263 352' transform='rotate(-90 100 100)'/%3E%3Cpolygon points='38,86 38,114 18,100' fill='%23e0632b'/%3E%3C/svg%3E`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/svg+xml" href={FAVICON} />
        <meta name="theme-color" content="#1c2340" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
