// ─────────────────────────────────────────────────────────────
// AION — PDF Export Utility
// ─────────────────────────────────────────────────────────────
// Opens a styled print window for exporting chats and strategy results.
// ─────────────────────────────────────────────────────────────

const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',system-ui,sans-serif; color:#1e293b; padding:40px; max-width:800px; margin:0 auto; }
  h1 { font-size:22px; font-weight:900; margin-bottom:4px; color:#070710; }
  h2 { font-size:16px; font-weight:700; margin:24px 0 8px; color:#334155; }
  .subtitle { font-size:11px; color:#64748b; margin-bottom:24px; }
  .logo { font-size:14px; font-weight:900; color:#7C3AED; margin-bottom:2px; }
  .msg { padding:12px 16px; margin:8px 0; border-radius:12px; font-size:13px; line-height:1.8; white-space:pre-wrap; }
  .msg-user { background:#f1f5f9; border-left:3px solid #7C3AED; }
  .msg-assistant { background:#fafafa; border-left:3px solid #06B6D4; }
  .msg-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#94a3b8; margin-bottom:4px; }
  .result { padding:20px; background:#fafafa; border:1px solid #e2e8f0; border-radius:12px; font-size:13px; line-height:1.85; white-space:pre-wrap; }
  .footer { margin-top:32px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:10px; color:#94a3b8; text-align:center; }
  @media print { body { padding:20px; } }
`;

function openPrintWindow(html: string, title: string): void {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title><style>${PRINT_CSS}</style></head><body>${html}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 600);
}

export function exportChat(
  messages: { role: string; content: string }[],
  modeName: string,
  modeEmoji: string
): void {
  if (!messages.length) return;
  const date = new Date().toLocaleDateString("es-UY", { year: "numeric", month: "long", day: "numeric" });
  let html = `<div class="logo">AION</div><h1>${modeEmoji} Co-Pilot · ${modeName}</h1><p class="subtitle">${date} · ${messages.length} mensajes</p>`;
  for (const m of messages) {
    const label = m.role === "user" ? "Tú" : "AION";
    const cls = m.role === "user" ? "msg-user" : "msg-assistant";
    html += `<div class="msg ${cls}"><div class="msg-label">${label}</div>${escapeHtml(m.content)}</div>`;
  }
  html += `<div class="footer">Exportado desde AION AI Business OS · ${date}</div>`;
  openPrintWindow(html, `AION Chat - ${modeName}`);
}

export function exportStrategy(
  sessionLabel: string,
  sessionEmoji: string,
  context: string,
  result: string
): void {
  const date = new Date().toLocaleDateString("es-UY", { year: "numeric", month: "long", day: "numeric" });
  let html = `<div class="logo">AION</div><h1>${sessionEmoji} ${sessionLabel}</h1><p class="subtitle">${date}</p>`;
  html += `<h2>Contexto</h2><div class="msg msg-user">${escapeHtml(context)}</div>`;
  html += `<h2>Resultado</h2><div class="result">${escapeHtml(result)}</div>`;
  html += `<div class="footer">Exportado desde AION AI Business OS · ${date}</div>`;
  openPrintWindow(html, `AION Strategy - ${sessionLabel}`);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
