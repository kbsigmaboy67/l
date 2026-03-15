import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { decodePayload, normalizeEncoding } from '../../../lib/decode';
import Head from 'next/head';

/*
  Route: /js/[mode]/[encoding]
  mode:
    blob     → wrap JS in an HTML page, Blob URL, window.location.replace()
    direct   → run script in current page context via <script> injection
               (useful for quick eval; runs in same origin)

  Fragment: encoded JS string OR an http(s) URL to fetch the script from
*/

export default function JsLoader() {
  const router = useRouter();
  const { mode, encoding } = router.query;
  const [state, setState] = useState({ status: 'loading', error: null, log: [] });

  useEffect(() => {
    if (!router.isReady) return;

    const hash = window.location.hash.slice(1);
    if (!hash) {
      setState({ status: 'error', error: 'No JS data in URL fragment (#).' });
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

        // If decoded looks like a URL, fetch the script
        if (/^https?:\/\//i.test(decoded.trim())) {
          const res = await fetch(decoded.trim());
          decoded = await res.text();
        }

        const resolvedMode = (mode || 'direct').toLowerCase();

        if (resolvedMode === 'blob') {
          // Wrap JS in a minimal HTML shell and navigate to blob
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>JS Runner</title></head><body><script>\n${decoded}\n<\/script></body></html>`;
          const blob = new Blob([html], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          window.location.replace(url);
        } else {
          // direct mode: inject into current page
          // Capture console.log output to show in UI
          const logs = [];
          const origLog = console.log;
          const origError = console.error;
          const origWarn = console.warn;
          console.log = (...a) => { logs.push({ type: 'log', msg: a.map(String).join(' ') }); origLog(...a); };
          console.error = (...a) => { logs.push({ type: 'error', msg: a.map(String).join(' ') }); origError(...a); };
          console.warn = (...a) => { logs.push({ type: 'warn', msg: a.map(String).join(' ') }); origWarn(...a); };

          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function(decoded);
            fn();
            setState({ status: 'done', log: logs });
          } catch (runErr) {
            logs.push({ type: 'error', msg: runErr.message });
            setState({ status: 'done', log: logs });
          } finally {
            console.log = origLog;
            console.error = origError;
            console.warn = origWarn;
          }
        }
      } catch (e) {
        setState({ status: 'error', error: e.message });
      }
    })();
  }, [router.isReady, mode, encoding]);

  return (
    <>
      <Head>
        <title>JS Runner</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0f0f0f; color: #d4d4d4; font-family: 'Fira Code', monospace, monospace; padding: 1.5rem; min-height: 100vh; }
          h2 { color: #86efac; margin-bottom: 1rem; font-size: 1rem; letter-spacing: 0.05em; }
          .log-line { padding: 0.25rem 0; border-bottom: 1px solid #1f1f1f; font-size: 0.875rem; }
          .log-line.log { color: #d4d4d4; }
          .log-line.error { color: #f87171; }
          .log-line.warn { color: #fbbf24; }
          .empty { color: #555; font-style: italic; }
          .loading { color: #9ca3af; }
          .err-box { color: #f87171; }
          .err-box h2 { color: #fca5a5; }
          .badge { display: inline-block; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.7rem; margin-right: 0.5rem; background: #1f1f1f; }
        `}</style>
      </Head>

      {state.status === 'loading' && <div className="loading">Decoding script…</div>}

      {state.status === 'error' && (
        <div className="err-box">
          <h2>⚠ JS Load Error</h2>
          <p>{state.error}</p>
        </div>
      )}

      {state.status === 'done' && (
        <>
          <h2>▶ Script executed — console output</h2>
          {state.log.length === 0 && <p className="empty">(no console output)</p>}
          {state.log.map((entry, i) => (
            <div key={i} className={`log-line ${entry.type}`}>
              <span className="badge">{entry.type}</span>{entry.msg}
            </div>
          ))}
        </>
      )}
    </>
  );
}
