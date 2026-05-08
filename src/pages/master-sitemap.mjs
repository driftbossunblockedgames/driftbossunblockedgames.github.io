export function createMasterSitemapPage({
  esc,
  absUrl,
  layout,
  nowPlayingStrip,
  breadcrumbs,
  getSitemaps
}) {
  return async function masterSitemapPage(host = "") {
    const crumbs = [
      { name: "Home", path: "/" },
      { name: "Master Sitemap", path: "/master-sitemap" }
    ];

    const sitemapPaths = getSitemaps();

    const body = `
      ${breadcrumbs(crumbs)}
      ${nowPlayingStrip()}
      
      <section class="section">
        <div class="sitemap-header">
          <div>
            <h1>Index File</h1>
            <p class="muted">List of all sitemap index files. Click 'Copy' to copy the path.</p>
          </div>
          <button class="btn-copy-all" type="button">Copy All Paths</button>
        </div>
        
        <div class="sitemap-list-container">
          ${sitemapPaths.map((path) => `
            <div class="sitemap-item">
              <span class="sitemap-path">${esc(path)}</span>
              <button class="btn-copy" type="button" data-copy-text="${esc(path)}">Copy</button>
            </div>
          `).join("")}
        </div>
      </section>

      <script>
        (() => {
          const paths = ${JSON.stringify(sitemapPaths)};

          async function writeClipboard(text) {
            if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(text);
              return;
            }

            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.top = '-9999px';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);

            const ok = document.execCommand('copy');
            textarea.remove();
            if (!ok) throw new Error('Copy command failed');
          }

          function showCopied(btn, label) {
            const originalText = btn.innerText;
            btn.innerText = label;
            btn.classList.add('copied');
            setTimeout(() => {
              btn.innerText = originalText;
              btn.classList.remove('copied');
            }, 2000);
          }

          document.addEventListener('click', async (event) => {
            const copyBtn = event.target.closest('.btn-copy');
            const copyAllBtn = event.target.closest('.btn-copy-all');
            const btn = copyBtn || copyAllBtn;
            if (!btn) return;

            try {
              await writeClipboard(copyBtn ? copyBtn.dataset.copyText : paths.join('\\n'));
              showCopied(btn, copyBtn ? 'Copied!' : 'All Paths Copied!');
            } catch {
              showCopied(btn, 'Copy Failed');
            }
          });
        })();
      </script>

      <style>
        .sitemap-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 25px;
          border-bottom: 1px solid var(--line);
          padding-bottom: 15px;
        }
        .sitemap-list-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .sitemap-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--line);
          border-radius: 8px;
          transition: background 0.2s;
        }
        .sitemap-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .sitemap-path {
          font-family: monospace;
          font-size: 14px;
          color: #101316;
        }
        .btn-copy, .btn-copy-all {
          padding: 6px 15px;
          background: #1a2231;
          border: 1px solid var(--line);
          border-radius: 6px;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-copy:hover, .btn-copy-all:hover {
          background: var(--lime);
          color: #000;
          border-color: var(--lime);
        }
        .btn-copy.copied {
          background: #2d4a1e;
          border-color: #4a822f;
          color: #fff;
        }
        .btn-copy-all {
          background: var(--lime);
          color: #000;
          border-color: var(--lime);
          padding: 10px 20px;
        }
      </style>
    `;

    return layout({
      title: "Master Sitemap Index - All Games and Guides",
      description: "Complete list of sitemap paths with easy copy functionality.",
      canonical: absUrl("/master-sitemap", host),
      body,
      host
    });
  };
}
