// ============================================================
// CLOUDFLARE WORKER
// everyone needs this part - do not delete this section!
// you will pu tthis in your worker, and any module code goes 
// between the comment break down belo 
// ============================================================

export default {
    async fetch(request, env) {
  
      // change this to your nekoweb URL this is the first security check in here, it wont accept stuff that isnt from your site
      const ALLOWED_ORIGIN = "https://CHANGEME.nekoweb.org";
      // heres the next safety thing for the guestbook 
      // set this to true if you want messages to go directly to your guestbook without you approving them first
      // if this is set to false, youll have to manually add your messages the same way we do with the drawings
      // THIS IS SET TO FALSE BY DEFAULT
      const OPEN_FOR_DIRECT = false;
      // this is how we specify what origins are ok, if its not from the allowed origin itll be denied
      const corsHeaders = {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
      }
  
      // verify origin - do not delete this, this is the thing checking its actually coming from your site
      const requestOrigin = request.headers.get("Origin");
      if (requestOrigin !== ALLOWED_ORIGIN) {
        return new Response(JSON.stringify({ error: "Unauthorized Origin" }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
  
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405, headers: corsHeaders });
      }
  
      try {
        const body = await request.json();
        const { type, filename, base64, author } = body;

        // ============================================================
        // PASTE MODULES BELOW HERE
        // ============================================================

 
  
        // ============================================================
        // END OF THE WORKER- PASTE MODULES ABOVE HERE
        // ============================================================
        return new Response(JSON.stringify({ error: 'Unknown request type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
  
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    },
  };