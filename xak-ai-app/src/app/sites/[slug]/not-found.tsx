export default function SiteNotFound() {
  return (
    <html lang="en">
      <head>
        <title>Project Not Found — XakCode</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            min-height: 100vh;
            background: #05030d;
            color: white;
            font-family: 'Inter', system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(56,189,248,.1);
            border: 1px solid rgba(56,189,248,.2);
            color: #38bdf8;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .1em;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 999px;
            margin-bottom: 1.5rem;
          }
          h1 { font-size: clamp(2.5rem, 8vw, 5rem); font-weight: 900; font-style: italic; letter-spacing: -0.04em; line-height: 1; margin-bottom: 1rem; }
          p  { color: rgba(255,255,255,.5); font-size: .875rem; max-width: 28rem; line-height: 1.6; margin-bottom: 2rem; }
          a  {
            display: inline-block;
            background: #0ea5e9;
            color: #000;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .1em;
            padding: 12px 28px;
            border-radius: 999px;
            text-decoration: none;
            transition: background .2s;
          }
          a:hover { background: #38bdf8; }
        `}</style>
      </head>
      <body>
        <div>
          <div className="badge">⚡ XakCode</div>
          <h1>404</h1>
          <p>This project doesn&apos;t exist or hasn&apos;t been published yet. Check the URL or publish your project from the XakCode IDE.</p>
          <a href="https://xakteir.com/xakcode">Open XakCode IDE →</a>
        </div>
      </body>
    </html>
  );
}
