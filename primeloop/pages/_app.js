import '../styles/globals.css';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { PIXEL_ID, pixelPageView } from '../lib/metaPixel';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    if (!PIXEL_ID) return;
    pixelPageView();
    const handleRouteChange = () => pixelPageView();
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <>
      {PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
