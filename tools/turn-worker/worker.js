/* Hexmancers duel relay logins: a Cloudflare Worker in front of Cloudflare Realtime TURN.
   The game (game/duelrelay.js, DUEL_RELAY.url = this Worker's address) asks it for short-lived relay logins before a
   duel; the Worker asks Cloudflare with the TURN key's secret token, which never reaches the game.
   Settings (Worker > Settings > Variables and Secrets):
     TURN_KEY_ID          the TURN key's id (Realtime > TURN Server)
     TURN_KEY_API_TOKEN   that key's API token (add it as a Secret)
     ALLOWED_ORIGINS      optional: comma list of page origins allowed to ask, e.g. https://html-classic.itch.zone
                          (empty: any page; set it so others cannot spend your relay) */
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const ok = !allowed.length || allowed.some(a => origin === a || (a.startsWith('*.') && origin.endsWith(a.slice(1))));
    const cors = { 'Access-Control-Allow-Origin': ok ? origin || '*' : 'null', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const json = (body, status) => new Response(JSON.stringify(body), { status: status || 200, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    if (!ok) return json({ error: 'origin not allowed' }, 403);
    if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return json({ error: 'TURN_KEY_ID and TURN_KEY_API_TOKEN are not set' }, 500);
    const r = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/' + env.TURN_KEY_ID + '/credentials/generate-ice-servers', {
      method: 'POST', headers: { Authorization: 'Bearer ' + env.TURN_KEY_API_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 }) });
    if (!r.ok) return json({ error: 'Cloudflare TURN answered ' + r.status }, 502);
    const j = await r.json(), list = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
    // browsers cannot use the port-53 addresses (they time out on them): leave those out
    for (const s of list) if (Array.isArray(s.urls)) s.urls = s.urls.filter(u => !/:53(\?|$)/.test(u));
    return json({ iceServers: list });
  }
};
