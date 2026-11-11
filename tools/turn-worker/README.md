# Duel relay logins (Cloudflare Worker)

Two phones duel directly when their network allows it. When it doesn't, for example a router that keeps devices apart, they need a relay (TURN). Cloudflare Realtime TURN is the relay. This Worker hands the game short-lived logins for it, so Cloudflare's secret token never goes into the game.

## Setup (dashboard only, about 10 minutes)

1. **Create a TURN key.**
   - In the Cloudflare dashboard, open **Realtime → TURN Server** and create a TURN key.
   - Copy its **key id** and its **API token**. The token is shown once.
2. **Create the Worker.**
   - Open **Workers & Pages → Create → Worker**, name it (e.g. `hexmancers-relay`) and deploy it.
   - Click **Edit code**, replace everything with `worker.js` from this folder, then **Deploy**.
3. **Add the settings.** In the Worker's **Settings → Variables and Secrets**, add:
   - `TURN_KEY_ID`, as text: the key id.
   - `TURN_KEY_API_TOKEN`, as a Secret: the API token.
   - `ALLOWED_ORIGINS`, as text: `https://html-classic.itch.zone`. This stops other pages using your relay; add more origins, comma-separated, if you host the game elsewhere.
4. **Check it.** Open `https://hexmancers-relay.<your-subdomain>.workers.dev` in a browser. It should answer `{"error":"origin not allowed"}`, because a direct visit has no allowed origin. That means it's running.
5. **Point the game at it.** In `game/duelrelay.js`, set `url:'https://hexmancers-relay.<your-subdomain>.workers.dev'`. Then build and zip.

In the game's Duel screen, **Connection log** should then read `relay: N server(s) from hexmancers-relay…`. If the relay carries the duel, the `using …` line shows `relay`.
