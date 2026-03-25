// blog module - displays blog posts with tag filtering
// requires: config.js to be loaded first


const blogPosts = [];

function initBlog() {
    const container = document.getElementById("blog-posts");
    if (!container) return;
    loadBlogPosts();
}

//functiom to parse markdown and allow users to use it to edit their blog just look up markdown
// notation but this honestly seemed like teh simplest way to edit text documents in github
function parseMarkdown(text) {
    return text
        .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
        .replace(/\n/g, '<br>');
}

//function to load blog posts from github, uses an index.json in your github as a list 
// to pull posts from, it will pull the title, date, tage and text from the posts 
async function loadBlogPosts() {
    const container = document.getElementById("blog-posts");
    const container2 = document.getElementById("blog-posts-only");
    if (!container) return;
    try {
        // fetch the index first to get the list of posts
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'listPosts' }),
        });
        const data = await res.json();

        // then loop through each post and fetch it
        for (const filename of data.posts) {
            const postRes = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'getPost', filename }),
            });
            const postData = await postRes.json();
            const raw = postData.content;

            const titleGet = raw.match(/^title:\s*(.+)$/m);
            const dateGet = raw.match(/^date:\s*(.+)$/m);
            const tagsGet = raw.match(/^tags:\s*(.+)$/m);
            let title; if (titleGet) { title = titleGet[1].trim(); } else { title = filename; }
            let date; if (dateGet) { date = dateGet[1].trim(); } else { date = ""; }
            let tags; if (tagsGet) { tags = tagsGet[1].split(',').map(t => t.trim()).filter(Boolean); } else { tags = []; }
            const body = parseMarkdown(raw.replace(/^---[\s\S]*?---/, "").trim());
            blogPosts.push({ title, date, tags, body });
        }
        renderBlogPosts(blogPosts, container, null);
        if (container2) renderBlogPosts(blogPosts, container2, null);
        const allTags = [...new Set(blogPosts.flatMap(p => p.tags))].sort();
        buildTagFilter('blog-tag-filter', 'blog-posts', allTags);
        buildTagFilter('blog-tag-filter-only', 'blog-posts-only', allTags);
        const countP = document.getElementById('post-count');
        if (countP) countP.textContent = `· ${blogPosts.length} posts`;
    } catch (e) {
        container.innerHTML = '<p style="font-size:11px;color:#5a9e7a;">Could not load.</p>';
    }
}

//function to render the blog posts on the page, it will create a div with the class 'blog-post-card' along with displaying its associated tags
//the classes used are: blog-post-card(the div teh post will live in), blog-post-tags(th div containing the tags ), 
//blog-tag-potato(this the clickable tags, the 'active' stuff is jsut used when you click on/select one you will likely not edit thsi calss directly), 
//blog-post-title,blog-post-date,blog-post-preview
function renderBlogPosts(posts, container, activeTag) {
    if (!container) return;
    container.innerHTML = "";
    const tagClass = (t) => {
        if (t === activeTag) {
            return 'blog-tag-potato active';
        } else {
            return 'blog-tag-potato';
        }
    }
    posts.forEach(({ title, date, tags, body }) => {
        const post = document.createElement("div");
        post.className = "blog-post-card";
        let tagsHtml;
        if (tags.length) {
            tagsHtml = `<div class="blog-post-tags">${tags.map(t =>
                `<span class="${tagClass(t)}" data-tag="${t}">${t}</span>`
            ).join('')}</div>`
        } else {
            tagsHtml = '';
        }
        post.innerHTML = `
            <div class="blog-post-title">${title}</div>
            <div class="blog-post-date">${date}</div>
            <div class="blog-post-preview">${body}</div>
            <div class="blog-post-full" style="display:none;">${body}</div>
            ${tagsHtml}
            <button class="blog-read-more">Read more...</button>
        `;
        container.appendChild(post);
        post.querySelector('.blog-read-more').addEventListener('click', () => {
            const full = post.querySelector('.blog-post-full');
            const preview = post.querySelector('.blog-post-preview');
            const isExpanded = full.style.display !== 'none';
            if (isExpanded) {
                full.style.display = 'none';
                preview.style.display = 'block';
                post.querySelector('.blog-read-more').textContent = 'Read more...';
            } else {
                full.style.display = 'block';
                preview.style.display = 'none';
                post.querySelector('.blog-read-more').textContent = 'Read less';
            }
        });
    });
}

//this lets people filter the posts by clicking on specific tags, i was a bit hungry so its potato themed and you just have to accept that 
function buildTagFilter(filterId, containerId, allTags) {
    const filterP = document.getElementById(filterId);
    if (!filterP) return;
    filterP.innerHTML = '';
    const addPotato = (label, isAll) => {
        const potato = document.createElement('span');
        if (isAll) {
            potato.className = 'blog-tag-potato active';
            potato.textContent = '# all';
        } else {
            potato.className = 'blog-tag-potato';
            potato.textContent = `# ${label}`;
        }
        if (!isAll) potato.dataset.tag = label;
        potato.addEventListener('click', () => {
            filterP.querySelectorAll('.blog-tag-potato').forEach(c => c.classList.remove('active'));
            potato.classList.add('active');
            const target = document.getElementById(containerId);
            let filteredPosts;
            if (isAll) {
                filteredPosts = blogPosts;
            } else {
                filteredPosts = blogPosts.filter(p => p.tags.includes(label));
            }
            let activeTag;
            if (isAll) {
                activeTag = null;
            } else {
                activeTag = label;
            }
            renderBlogPosts(filteredPosts, target, activeTag);
        });
        filterP.appendChild(potato);
    }
    addPotato('all', true);
    allTags.forEach(tag => addPotato(tag, false));
}
