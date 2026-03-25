       // ============================================================
        // DRAWBOX MODULE
        // this section contians the code for the drawbox specifically!
        // ============================================================
  
        // lists approved drawings from your gallery folder
        if (type === 'list') {
            const githubRes = await fetch(
              `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/gallery/`,
              {
                headers: {
                  'Authorization': `token ${env.GITHUB_TOKEN}`,
                  'User-Agent': 'drawbox-worker',
                },
              }
            );
            const result = await githubRes.json();
            return new Response(JSON.stringify(result), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
    
          // fetches a single image from your private repo
          if (type === 'getImage') {
            const { filename } = body;
            if (!filename || !filename.endsWith('.png')) {
              return new Response(JSON.stringify({ error: 'Invalid filename' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            const githubRes = await fetch(
              `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/gallery/${filename}`,
              {
                headers: {
                  'Authorization': `token ${env.GITHUB_TOKEN}`,
                  'User-Agent': 'drawbox-worker',
                },
              }
            );
            const data = await githubRes.json();
            const imageBytes = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
            return new Response(imageBytes, {
              headers: {
                ...corsHeaders,
                'Content-Type': 'image/png',
              },
            });
          }
    
          // submits a new drawing to your drawings folder for approval
          //it should be noted that drawings above a certain file size will NOT be accepted
          if (type === 'submit') {
            const imageContent = Array.isArray(base64) ? base64[1] : base64;
            
            // you change the accepted filesize here if you really want to
            if (imageContent.length > 2_700_000) {
                return new Response(JSON.stringify({ error: 'File too large' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        
            const commitMsg = `New drawing by ${author} at ${new Date().toUTCString()}`;
            const githubRes = await fetch(
                `https://api.github.com/repos/${env.GITHUB_USER}/${env.GITHUB_REPO}/contents/drawings/${filename}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${env.GITHUB_TOKEN}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'drawbox-worker',
                    },
                    body: JSON.stringify({
                        message: commitMsg,
                        content: imageContent,
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