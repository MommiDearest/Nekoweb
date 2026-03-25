// ============================================================
// BLOG MODULE
// this has the worker code for fetching your blog posts!
// ============================================================

// fetches the index.json  which will haev all of your posts by filename
// the order of the files in the index will affect how they appear in your blog 
if (type === 'listPosts') {
    const githubRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/posts/index.json`,
        {
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'User-Agent': 'drawbox-worker',
            },
        }
    );
    if (!githubRes.ok) {
        return new Response(JSON.stringify({ error: 'Could not load posts index' }), {
            status: githubRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const data = await githubRes.json();
    const decoded = JSON.parse(atob(data.content.replace(/\n/g, '')));
    return new Response(JSON.stringify(decoded), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// fetches a specific blog post by filename, so it lets you open just that post
if (type === 'getPost') {
    const { filename } = body;
    if (!filename || !filename.endsWith('.md')) {
        return new Response(JSON.stringify({ error: 'Invalid filename' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const githubRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/posts/${filename}`,
        {
            headers: {
                'Authorization': `token ${env.GITHUB_TOKEN}`,
                'User-Agent': 'drawbox-worker',
            },
        }
    );
    if (!githubRes.ok) {
        return new Response(JSON.stringify({ error: 'Could not load post' }), {
            status: githubRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    const data = await githubRes.json();
    const decoded = atob(data.content.replace(/\n/g, ''));
    return new Response(JSON.stringify({ content: decoded }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}
