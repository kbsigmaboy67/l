import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { decodePayload, normalizeEncoding } from '../../../lib/decode';
import Head from 'next/head';

/*
  Route: /html/[mode]/[encoding]
  mode:
    blob     → create a Blob URL and window.location.replace() to it
    direct   → srcdoc iframe / document.write approach (stays on same URL)

  Fragment: encoded HTML string OR an http(s) URL to fetch
*/

export default function HtmlLoader() {
  const router = useRouter();
  const { mode, encoding } = router.query;
  const [state, setState] = useState({ status: 'loading', error: null, srcdoc: null });

  useEffect(() => {
    if (!router.isReady) return;

    const hash = window.location.hash.slice(1);
    if (!hash) {
      setState({ status: 'error', error: 'No HTML data in URL fragment (#).' });
      return;
    }

    const norm = normalizeEncoding(encoding);
    if (!norm) {
      setState({ status: 'error', error: `Unknown encoding: "${encoding}". Supported: base64, hex, hexadecimal, uri, plain, utf-8, binary, rot13` });
      return;
    }

    (async () => {
      try {
        let decoded = decodePayload(hash, encoding);

        // If decoded looks like a URL, fetch it
        if (/^https?:\/\//i.test(decoded.trim())) {
          const res = await fetch(decoded.trim());
          decoded = await res.text();
        }

        const resolvedMode = (mode || 'direct').toLowerCase();

        if (resolvedMode === 'blob') {
          const blob = new Blob([decoded], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          window.location.replace(url);
          // page navigates away; nothing more to do
        } else {
          // direct mode: render via iframe srcdoc
          setState({ status: 'ready', srcdoc: decoded });
        }
      } catch (e) {
        setState({ status: 'error', error: e.message });
      }
    })();
  }, [router.isReady, mode, encoding]);

  return (
    <>
      <Head>
        <title>HTML Loader</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body, #__next { height: 100%; width: 100%; }
          iframe { width: 100%; height: 100%; border: none; display: block; }
          .error { color: #f87171; background: #1a1a1a; padding: 2rem; font-family: monospace; }
          .error h2 { color: #fca5a5; margin-bottom: 1rem; }
          .loading { color: #9ca3af; font-family: monospace; padding: 2rem; }
        `}</style>
      </Head>

      {state.status === 'loading' && <div className="loading">Decoding HTML…</div>}
      {state.status === 'error' && (
        <div className="error">
          <h2>⚠ HTML Load Error</h2>
          <p>{state.error}</p>
        </div>
      )}
      {state.status === 'ready' && (
        <iframe
          title="Loaded HTML"
          srcdoc={state.srcdoc}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}
    </>
  );
}
