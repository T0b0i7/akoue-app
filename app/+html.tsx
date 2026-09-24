
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preload" as="image" href="/images/splash-icon.png" />
        <style dangerouslySetInnerHTML={{
          __html: `
          #splash{position:fixed;inset:0;background:#171717;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;transition:opacity 0.35s ease}
          #splash.hidden{opacity:0;pointer-events:none}
          #splash-logo{width:140px;height:140px;border-radius:32px;background:#7A4DFF;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 24px rgba(122,77,255,0.4)}
          #splash-logo img{width:96px;height:96px;border-radius:16px;display:block}
          #splash-title{margin-top:24px;color:#fff;font-size:32px;font-weight:800;letter-spacing:1px;font-family:system-ui,-apple-system,sans-serif}
          #splash-sub{margin-top:6px;color:#a3a3a3;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-family:system-ui,-apple-system,sans-serif}
          `
        }} />
      </head>
      <body>
        <div id="splash">
          <div id="splash-logo"><img src="/images/splash-icon.png" alt="Akouè" width={96} height={96} /></div>
          <div id="splash-title">Akouè</div>
          <div id="splash-sub">Maîtrise ton argent</div>
        </div>
        {children}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            function hide(){var s=document.getElementById('splash');if(s){s.classList.add('hidden');setTimeout(function(){s.style.display='none'},400);}}
            // cache des que React a hydraté + max 2.5s
            window.addEventListener('load', function(){ setTimeout(hide, 600); });
            setTimeout(hide, 2500);
          })();
          `
        }} />
      </body>
    </html>
  );
}
