
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' https://*.supabase.co data: blob: https://api.frankfurter.app https://open.er-api.com; connect-src 'self' https://*.supabase.co https://api.frankfurter.app https://open.er-api.com wss://*.supabase.co; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="preload" as="image" href="/images/splash-icon.png" />
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#171717;margin:0;padding:0;min-height:100%}body{overflow-x:hidden}#root{flex:1;display:flex;min-height:100vh;background:#171717}#splash{position:fixed;inset:0;background:#171717;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity 0.4s ease}#splash.hidden{opacity:0;pointer-events:none}#splash-logo{width:140px;height:140px;border-radius:32px;background:#7A4DFF;display:flex;align-items:center;justify-content:center}#splash-logo img{width:96px;height:96px;border-radius:16px}#splash-title{margin-top:24px;color:#fff;font-size:32px;font-weight:800;letter-spacing:1px;font-family:system-ui,sans-serif}#splash-sub{margin-top:6px;color:#a3a3a3;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:system-ui,sans-serif}` }} />
        <script dangerouslySetInnerHTML={{ __html: `window.hideSplash=function(){var s=document.getElementById('splash');if(s){s.classList.add('hidden');setTimeout(function(){s.style.display='none'},450);}};setTimeout(window.hideSplash,8000);` }} />
      </head>
      <body>
        <div id="splash"><div id="splash-logo"><img src="/images/splash-icon.png" alt="Akouè" width="96" height="96" /></div><div id="splash-title">Akouè</div><div id="splash-sub">Maîtrise ton argent</div></div>
        {children}
      </body>
    </html>
  );
}
