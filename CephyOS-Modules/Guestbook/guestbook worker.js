// ============================================================
// GUESTBOOK MODULE
// //this has the info for your guestbook, rememebr that if OPEN_FOR_DIRECT 
// is set to true, messages will be posted without your approval
// ============================================================

// lists approved guestbook messages
if (type === 'listGuest') {
    const githubRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/guestbook/`,
        {
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'User-Agent': 'drawbox-worker',
            },
        }
    );
    if (githubRes.status === 404) {
        return new Response(JSON.stringify({ entries: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const files = await githubRes.json();
    const entries = await Promise.all(
        files
            .filter(f => f.name.endsWith('.json'))
            .map(async f => {
                const fileRes = await fetch(f.url, {
                    headers: {
                        'Authorization': `token ${env.GITHUB_TOKEN}`,
                        'User-Agent': 'drawbox-worker',
                    },
                });
                const fileData = await fileRes.json();
                return JSON.parse(atob(fileData.content.replace(/\n/g, '')));
            })
    );
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    return new Response(JSON.stringify({ entries }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// where things get submitted, the length of the messages and the usernames are LIMITED
//  if you want to change that do so, but these were added for safety reasons
if (type === 'submitMail') {
    const { name, message } = body;
    // if message too short, or message too long say no
    if (!message || message.trim().length < 1 || message.length > 500) {
        return new Response(JSON.stringify({ error: 'Invalid message' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    // in case they try to spam in the name box
    if (name && name.length > 30) {
        return new Response(JSON.stringify({ error: 'Name too long' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const mailFilename = `${Date.now()}.json`;
    const entry = {
        name: (name || 'Anonymous').trim().slice(0, 30),
        message: message.trim().slice(0, 500),
        date: new Date().toISOString(),
    };
    const commitMsg = `Mailbox message from ${name || 'Anonymous'} at ${new Date().toUTCString()}`;
    const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(entry, null, 2))));
    const folder = OPEN_FOR_DIRECT ? 'guestbook' : 'mailbox';
    const githubRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/${folder}/${mailFilename}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'drawbox-worker',
            },
            body: JSON.stringify({
                message: commitMsg,
                content: newContent,
            }),
        }
    );
    const result = await githubRes.json();
    if (!githubRes.ok) {
        return new Response(JSON.stringify({ error: result.message }), {
            status: githubRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
