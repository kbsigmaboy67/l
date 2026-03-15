import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { decodePayload, normalizeEncoding } from '../../lib/decode';
import Head from 'next/head';

export default function ImageLoader() {
  const router = useRouter();
  const { encoding } = router.query;
  const [state, setState] = useState({ status: 'loading', src: null, error: null, isUrl: false });

  useEffect(() => {
    if (!router.isReady) return;

    const hash = window.location.hash.slice(1); // strip leading #
    if (!hash) {
      setState({ status: 'error', error: 'No image data in URL fragment (#). Provide base64/hex/etc. data or a URL after #.' });
      return;
    }

    const norm = normalizeEncoding(encoding);
    if (!norm) {
      setState({ status: 'error', error: `Unknown encoding type: "${encoding}". Supported: base64, hex, hexadecimal, uri, plain, utf-8, binary, rot13` });
      return;
    }

    try {
      const decoded = decodePayload(hash, encoding);

      // Check if decoded value looks like a URL
      const isUrl = /^https?:\/\//i.test(decoded.trim());

      if (isUrl) {
        setState({ status: 'ready', src: decoded.trim(), isUrl: true });
      } else {
        // Treat as raw binary / data URI content
        // Try to detect image type from magic bytes or assume it's already a data URI
        if (decoded.startsWith('data:image')) {
          setState({ status: 'ready', src: decoded, isUrl: false });
        } else {
          // Encode binary string as Uint8Array → Blob → Object URL
          const bytes = new Uint8Array(decoded.length);
          for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i) & 0xff;
          const blob = new Blob([bytes]); // browser will sniff MIME
          const objectUrl = URL.createObjectURL(blob);
          setState({ status: 'ready', src: objectUrl, isUrl: false });
        }
      }
    } catch (e) {
      setState({ status: 'error', error: e.message });
    }
  }, [router.isReady, encoding]);

  return (
    <>
      <Head>
        <title>Image Loader</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #111; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: monospace; }
          img { max-width: 100vw; max-height: 100vh; display: block; object-fit: contain; }
          .error { color: #f87171; background: #1a1a1a; padding: 2rem; border-radius: 8px; max-width: 600px; line-height: 1.6; }
          .error h2 { color: #fca5a5; margin-bottom: 1rem; }
          .loading { color: #9ca3af; }
        `}</style>
      </Head>

      {state.status === 'loading' && <div className="loading">Decoding…</div>}

      {state.status === 'error' && (
        <div className="error">
          <h2>⚠ Image Load Error</h2>
          <p>{state.error}</p>
        </div>
      )}

      {state.status === 'ready' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={state.src} alt="Loaded image" />
      )}
    </>
  );
}
