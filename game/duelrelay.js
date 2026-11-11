/* Hexmancers - the duel relay (TURN). Two phones duel straight to each other when their network lets them; when it
   does not (a router that keeps devices apart, mobile data, two different networks), a relay server passes the duel's
   messages between them. Set one of these to turn the relay on; leave both empty and duels stay direct only.
     url      an address that hands out short-lived relay logins as JSON: an array of ICE servers, or {iceServers:[...]}.
              Metered (metered.ca): https://<your-app>.metered.live/api/v1/turn/credentials?apiKey=<your API key>
              (the credential API key is made for use in a web page; never put an account secret key here).
              Cloudflare Realtime TURN needs a secret token, so it goes behind a small Worker of your own whose
              address goes here.
     servers  fixed ICE servers, e.g. [{urls:'turn:relay.example.com:3478', username:'u', credential:'p'}].
   Logins fetched from url are kept for an hour. */
window.DUEL_RELAY={ url:'', servers:null };
