import Head from 'next/head';
import { useState } from 'react';

const ROUTES = [
  {
    path: '/image/[encoding]#[data]',
    color: '#38bdf8',
    icon: '🖼',
    title: 'Image Loader',
    desc: 'Renders any image from encoded data or a URL.',
    modes: null,
    params: [
      { name: 'encoding', desc: 'One of: base64, hex, hexadecimal, uri, plain, utf-8, binary, rot13' },
      { name: '#data', desc: 'Encoded image bytes OR an encoded URL pointing to an image' },
    ],
    examples: [
      { label: 'base64 URL', url: '/image/base64#aHR0cHM6Ly9waWNzdW0ucGhvdG9zLzIwMC8zMDA=' },
      { label: 'uri-encoded URL', url: '/image/uri#https%3A%2F%2Fpicsum.photos%2F400%2F300' },
      { label: 'plain URL', url: '/image/plain#https://picsum.photos/600/400' },
    ],
  },
  {
    path: '/html/[mode]/[encoding]#[data]',
    color: '#a78bfa',
    icon: '📄',
    title: 'HTML Loader',
    desc: 'Renders HTML from encoded data or fetches from a URL.',
    modes: [
      { name: 'blob', desc: 'Creates a Blob URL and navigates (full-page, no frame)' },
      { name: 'direct', desc: 'Renders in a sandboxed iframe (stays on same URL)' },
    ],
    params: [
      { name: 'mode', desc: 'blob or direct' },
      { name: 'encoding', desc: 'One of: base64, hex, hexadecimal, uri, plain, utf-8, binary, rot13' },
      { name: '#data', desc: 'Encoded HTML string OR an encoded URL to fetch HTML from' },
    ],
    examples: [
      { label: 'Hello World (base64, direct)', url: '/html/direct/base64#PGgxPkhlbGxvIFdvcmxkITwvaDE+' },
      { label: 'Hello World (uri, blob)', url: '/html/blob/uri#%3Ch1%3EHello%20World!%3C%2Fh1%3E' },
    ],
  },
  {
    path: '/js/[mode]/[encoding]#[data]',
    color: '#fbbf24',
    icon: '⚡',
    title: 'JS Runner',
    desc: 'Executes JavaScript from encoded data or a URL.',
    modes: [
      { name: 'blob', desc: 'Wraps JS in an HTML shell Blob, navigates to it' },
      { name: 'direct', desc: 'Runs in current page context, shows console output' },
    ],
    params: [
      { name: 'mode', desc: 'blob or direct' },
      { name: 'encoding', desc: 'One of: base64, hex, hexadecimal, uri, plain, utf-8, binary, rot13' },
      { name: '#data', desc: 'Encoded JS string OR an encoded URL to fetch a script from' },
    ],
    examples: [
      { label: 'console.log (base64, direct)', url: '/js/direct/base64#Y29uc29sZS5sb2coJ0hlbGxvIGZyb20gSlMgcnVubmVyIScpOw==' },
      { label: 'alert (base64, blob)', url: '/js/blob/base64#YWxlcnQoJ2hpJyk=' },
    ],
  },
];

const ENCODINGS = [
  { slug: 'base64', label: 'Base64', fn: s => btoa(unescape(encodeURIComponent(s))) },
  { slug: 'hex', label: 'Hex', fn: s => [...new TextEncoder().encode(s)].map(b => b.toString(16).padStart(2,'0')).join('') },
  { slug: 'uri', label: 'URI / percent', fn: s => encodeURIComponent(s) },
  { slug: 'plain', label: 'Plain / UTF-8', fn: s => s },
  { slug: 'binary', label: 'Binary (latin-1)', fn: s => s },
  { slug: 'rot13', label: 'ROT-13', fn: s => s.replace(/[a-zA-Z]/g, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode(((c.charCodeAt(0)-b+13)%26)+b); }) },
];

export default function Home() {
  const [tab, setTab] = useState('image');
  const [input, setInput] = useState('');
  const [enc, setEnc] = useState('base64');
  const [mode, setMode] = useState('direct');
  const [encoded, setEncoded] = useState('');
  const [builtUrl, setBuiltUrl] = useState('');

  function encode() {
    const fn = ENCODINGS.find(e => e.slug === enc)?.fn;
    if (!fn || !input.trim()) return;
    const out = fn(input);
    setEncoded(out);
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    let url = '';
    if (tab === 'image') url = `${base}/image/${enc}#${out}`;
    else if (tab === 'html') url = `${base}/html/${mode}/${enc}#${out}`;
    else url = `${base}/js/${mode}/${enc}#${out}`;
    setBuiltUrl(url);
  }

  return (
    <>
      <Head>
        <title>DataLoader</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box}
          body{background:#0a0a0a;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6}
          a{color:inherit;text-decoration:none}
          .wrap{max-width:900px;margin:0 auto;padding:3rem 1.5rem}
          h1{font-size:2.2rem;font-weight:700;letter-spacing:-0.03em;margin-bottom:0.3rem}
          .tagline{color:#6b7280;margin-bottom:3rem;font-size:1.05rem}
          .card{background:#111;border:1px solid #1f1f1f;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
          .card-header{display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem}
          .card-title{font-size:1.1rem;font-weight:600}
          .badge{display:inline-block;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.7rem;font-weight:600;letter-spacing:0.05em;font-family:monospace}
          .route{font-family:monospace;font-size:0.9rem;background:#0f0f0f;padding:0.6rem 0.9rem;border-radius:6px;margin-bottom:1rem;word-break:break-all}
          .desc{color:#9ca3af;font-size:0.9rem;margin-bottom:1rem}
          table{width:100%;border-collapse:collapse;font-size:0.85rem}
          th{text-align:left;color:#6b7280;padding:0.3rem 0;border-bottom:1px solid #1f1f1f;font-weight:500}
          td{padding:0.35rem 0;border-bottom:1px solid #0f0f0f;vertical-align:top}
          td:first-child{font-family:monospace;color:#a78bfa;padding-right:1rem;white-space:nowrap}
          .modes-row{margin:0.75rem 0;color:#9ca3af;font-size:0.85rem}
          .modes-row strong{color:#e5e7eb}
          .ex-link{display:inline-block;margin-top:0.5rem;margin-right:0.5rem;font-size:0.78rem;font-family:monospace;color:#38bdf8;background:#0f172a;padding:0.2rem 0.6rem;border-radius:4px}
          .ex-link:hover{background:#1e3a5f}
          h2{font-size:1.4rem;font-weight:600;margin-bottom:1.5rem;margin-top:3rem}
          .enc-tabs{display:flex;gap:0.5rem;margin-bottom:1rem;flex-wrap:wrap}
          .enc-tab{padding:0.4rem 0.9rem;border-radius:6px;border:1px solid #1f1f1f;background:#0f0f0f;color:#9ca3af;cursor:pointer;font-size:0.85rem;transition:all 0.15s}
          .enc-tab.active{background:#1f2937;color:#e5e7eb;border-color:#374151}
          textarea{width:100%;background:#0f0f0f;border:1px solid #1f1f1f;border-radius:6px;color:#e5e7eb;padding:0.75rem;font-family:monospace;font-size:0.85rem;resize:vertical;outline:none;min-height:80px}
          textarea:focus{border-color:#374151}
          .row{display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;margin:0.75rem 0}
          select{background:#0f0f0f;border:1px solid #1f1f1f;border-radius:6px;color:#e5e7eb;padding:0.4rem 0.7rem;font-size:0.85rem;outline:none;cursor:pointer}
          button{background:#1d4ed8;color:#fff;border:none;border-radius:6px;padding:0.45rem 1.1rem;font-size:0.85rem;cursor:pointer;font-weight:500}
          button:hover{background:#2563eb}
          .out{margin-top:0.75rem;font-family:monospace;font-size:0.8rem;background:#0f0f0f;padding:0.75rem;border-radius:6px;word-break:break-all;color:#86efac;border:1px solid #1f1f1f}
          .url-out{margin-top:0.5rem;font-family:monospace;font-size:0.78rem;background:#0f172a;padding:0.75rem;border-radius:6px;word-break:break-all;color:#38bdf8;border:1px solid #0f2a4a}
          .url-out a{color:#38bdf8}
          .url-out a:hover{text-decoration:underline}
          .copy-btn{background:#0f2a4a;color:#38bdf8;border:1px solid #1e3a5f;margin-left:0.5rem;font-size:0.75rem;padding:0.2rem 0.6rem}
          .copy-btn:hover{background:#1e3a5f}
          footer{margin-top:4rem;color:#374151;font-size:0.8rem;text-align:center;padding-bottom:2rem}
        `}</style>
      </Head>

      <div className="wrap">
        <h1>🔗 DataLoader</h1>
        <p className="tagline">Load images, HTML, and JavaScript directly from URL-encoded fragments. Everything runs in your browser.</p>

        {ROUTES.map(r => (
          <div className="card" key={r.path}>
            <div className="card-header">
              <span style={{fontSize:'1.4rem'}}>{r.icon}</span>
              <span className="card-title">{r.title}</span>
              <span className="badge" style={{background: r.color+'22', color: r.color}}>{r.path.split('/')[1].toUpperCase()}</span>
            </div>
            <div className="route">{r.path}</div>
            <p className="desc">{r.desc}</p>
            {r.modes && (
              <div className="modes-row">
                <strong>Modes: </strong>
                {r.modes.map((m, i) => (
                  <span key={m.name}><code style={{color:'#fbbf24'}}>{m.name}</code> — {m.desc}{i < r.modes.length - 1 ? ' · ' : ''}</span>
                ))}
              </div>
            )}
            <table>
              <thead><tr><th>Param</th><th>Description</th></tr></thead>
              <tbody>
                {r.params.map(p => (
                  <tr key={p.name}><td>{p.name}</td><td style={{color:'#d1d5db'}}>{p.desc}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:'0.75rem'}}>
              {r.examples.map(ex => (
                <a key={ex.url} href={ex.url} className="ex-link" target="_blank" rel="noopener noreferrer">↗ {ex.label}</a>
              ))}
            </div>
          </div>
        ))}

        <h2>🔧 URL Builder</h2>
        <div className="card">
          <div className="enc-tabs">
            {['image','html','js'].map(t => (
              <div key={t} className={`enc-tab${tab===t?' active':''}`} onClick={()=>setTab(t)}>{t.toUpperCase()}</div>
            ))}
          </div>
          <div style={{marginBottom:'0.5rem',color:'#9ca3af',fontSize:'0.85rem'}}>Raw input (will be encoded):</div>
          <textarea
            value={input}
            onChange={e=>setInput(e.target.value)}
            placeholder={
              tab==='image' ? 'Paste an image URL or raw image bytes…' :
              tab==='html' ? '<h1>Hello World!</h1>\nor paste a URL to fetch HTML from…' :
              'console.log("Hello!")\nor paste a URL to fetch a script from…'
            }
          />
          <div className="row">
            <select value={enc} onChange={e=>setEnc(e.target.value)}>
              {ENCODINGS.map(e=><option key={e.slug} value={e.slug}>{e.label}</option>)}
            </select>
            {tab !== 'image' && (
              <select value={mode} onChange={e=>setMode(e.target.value)}>
                <option value="direct">Mode: direct (iframe)</option>
                <option value="blob">Mode: blob (navigate)</option>
              </select>
            )}
            <button onClick={encode}>Build URL →</button>
          </div>
          {encoded && builtUrl && (
            <>
              <div className="out">
                <div style={{color:'#6b7280',fontFamily:'sans-serif',fontSize:'0.73rem',marginBottom:'0.3rem'}}>ENCODED FRAGMENT</div>
                {encoded}
              </div>
              <div className="url-out">
                <div style={{color:'#6b7280',fontFamily:'sans-serif',fontSize:'0.73rem',marginBottom:'0.3rem'}}>GENERATED URL</div>
                <a href={builtUrl} target="_blank" rel="noopener noreferrer">{builtUrl}</a>
                <button className="copy-btn" onClick={()=>navigator.clipboard.writeText(builtUrl)}>Copy</button>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">📦 Encoding Reference</span></div>
          <table>
            <thead><tr><th>Slugs accepted</th><th>Description</th></tr></thead>
            <tbody>
              {[
                ['base64, b64','Standard Base64 (browser atob/btoa)'],
                ['hex, hexadecimal','Hex string — e.g. 3c68746d6c3e'],
                ['uri, url','Percent-encoding (encodeURIComponent)'],
                ['plain, utf-8, utf8, text, raw','No encoding — literal UTF-8 string'],
                ['binary, bin','Binary / latin-1 byte string'],
                ['rot13','ROT-13 letter rotation'],
              ].map(([s,d])=>(
                <tr key={s}><td>{s}</td><td style={{color:'#d1d5db'}}>{d}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer>DataLoader · all decoding happens client-side in your browser · no data sent to server</footer>
      </div>
    </>
  );
}
