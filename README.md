# Cephy's Nekoweb Modules
Here is a collection of modules for Nekoweb, so far there's a guestbook, a drawbox, and a blog. The modules use GitHub and Cloudflare for security. Your data lives in your own GitHub repo, and your Cloudflare Worker uses your GitHub token to ferry the info between your site and GitHub. There are a few security features built in (due to my own experience of being harassed) so you can limit messages, their frequency, have images manually approved, and a few extra things to help moderate the content.

Also It's really cheesy but I named it CephyOS since thats what my site it 'running', speaking of you can find the modules  in use here: https://picoglobe.nekoweb.org/Cephy OS/test.html

---

### So what do you need?
- a GitHub account
- a Cloudflare account (the free tier is what I use and is totally fine)
- your Nekoweb site or an HTML file to add the modules to
- a text editor, which if you're looking at this I'm assuming you're already set

---
### File Types We'll Be Working With

- `.css` - CSS files are what you use online to make your website pretty. The ones here are set up with what you need to edit each module's parts.

- `.js` - JS files have the JavaScript code that's going to be running for each module. You'll add it to your HTML using `<script src="filename.js"></script>`

- `.html` - This is the language used to create web pages. If you don't know much about this, take a step back and learn more before you continue with this tutorial!

- `.json` - This is a file written in a style that comes from JavaScript. All it does is contain certain values that the code here is going to read.

- `.md` - This is a Markdown file. Markdown is a way to format text online that uses symbols on your keyboard to format it in ways that look nice, similar to a normal text editor. If you prefer to use a normal text editor you can find a bunch of rich text to Markdown converters online!

---

## GitHub Setup

Ok so I'm going to write this assuming you won't have a GitHub account. First you need to sign up for GitHub using whatever email you want, and you'll notice in the top right corner, once you have your account, is a circle with a weird image in it. That's your user menu. Click on that, click on "Repositories", and in the top left you'll see a button that says "New".

This creates your repo, you get a few options here, I suggest private, create a README, and don't worry about the license. Now GitHub has a quirk, unless you're on GitHub Desktop, you can't create a folder without putting a file inside it. The best way to do this is to click on "Add file", then "Create new file", and you're going to name it `FOLDER-NAME/.gitkeep`. Obviously you change the folder name to whatever folder you're looking to create, but the `.gitkeep` is just a file that GitHub ignores and acts as a placeholder.

So let's get to the actual folder structure. Each module uses a specific folder structure to communicate with GitHub while this URL is one you can change, if you aren't comfy changing it you can go ahead and just make the exact structure I have here:
```
your-repo/
├── posts/.gitkeep          -> your blog posts go here
├── drawings/.gitkeep       -> submitted drawings go here (unmoderated)
├── gallery/.gitkeep        -> approved drawings go here (what people see)
└── mailbox/.gitkeep        -> submitted guestbook messages go here (unmoderated)
└── guestbook/.gitkeep      -> approved guestbook messages go here (what people see)
```

Drawings and gallery are intentionally split, if an image is submitted you manually check it, and if you approve of it you copy it over to gallery, which is what your site will use to display them. This way you can ensure ONLY images you approve of are accessible.

If you're going to use the blog module then you're going to need to create a file in there, so in posts click on "Add file" > "Create new file" and you're going to call it `index.json`. This file lists each one of your blog posts in order, so every time you want to make a new post you add the file (a text file in Markdown, which you can learn more about here: https://commonmark.org/help/). Inside `index.json` just paste this:
```json
{
    "posts": ["template.md"]
}
```

When you make a blog post you will also be using Markdown, so go ahead and create another text file, call it `template.md` and paste this inside:
```md
---
title: My Post Title
date: 2026-03-21
tags: tag1, tag2
---
Your post content goes here!
```

### GitHub Personal Access Token

One of the most important bits is your GitHub token! This is like a password your Cloudflare Worker will use to submit things to GitHub. **DON'T SHARE THIS** if you do, anyone can drop stuff in your GitHub and we'll all be sad, and no one wants to be sad.

You'll be making a Personal Access Token (Classic). Click on this link: https://github.com/settings/tokens. This takes you to where you can make a token. Click on "Personal access tokens" > "Tokens (classic)" and on the top right of the page click "Generate new token".

You'll be hit with a menu, the ONLY things you care about here are:

- Change the expiration date:  you can either make it never expire, or give 
  it an expiration date, your choice
- Click on the checkbox next to "repo" the very top one

That's it, scroll down and click "Generate token". **THIS TOKEN WILL DISAPPEAR AFTER YOU SEE IT** write it down in a notepad on your PC because you're going to need it for the next section. Once we're done setting everything up you can delete it from your notepad and never look at it again!

---

## Cloudflare Worker Setup

You might be wondering why do I need this thing, I already had to make another account?? 

Because this is online, and because some people don't like seeing others have fun, we have to be careful. Since we're pulling information directly from your GitHub onto the page we need to make sure not just anyone can do that. That's why we have the token! BUT the token needs to be kept safe and secret *(insert Gandalf "keep it secret, keep it safe" here)* so to do that we give it to the Worker.

The Worker is a middleman between Nekoweb and GitHub. It takes things submitted on your Nekoweb and goes to GitHub saying "hey, someone made this, take it please" it shows GitHub the token, and GitHub accepts it. It also takes the info from your private GitHub and pulls it over to your Nekoweb saying "hey, I have the password so you can give it to me, don't worry."

---

Ok so let's make our account. You're going to go to cloudflare.com and sign up for their free tier, don't worry. Once you're in, look for "Workers & Pages" in the left sidebar. Depending on how you sign up it might prompt you to create a Worker??  I've seen it happen a few different ways, but the ultimate goal is to click "Create" and then "Create Worker". Cloudflare will auto-assign a random name to it, which you can change later. Once you do that, click "Deploy".

Since nothing is actually happening right now, the code that's in there doesn't matter and isn't doing anything plus we're going to replace it all. Once it's deployed, click "Edit code".

### Adding the Worker code

Here's where you have a bit more agency. Inside each folder there's a Cloudflare Worker code file with the relevant code for each section. There is some setup stuff we're going to do now though, so copy and paste this in and edit the URL with your Nekoweb one: 

```js
// ============================================================
// CLOUDFLARE WORKER
// everyone needs this part - do not delete this section!
// ============================================================

export default {
    async fetch(request, env) {
  
      // change this to your nekoweb URL this is the first security check in here, it wont accept stuff that isnt from your site
      const ALLOWED_ORIGIN = "https://CHANGEME.nekoweb.org";
      // heres the next safety thing for the guestbook 
      // set this to true if you want messages to go directly to your guestbook without you approving them first
      // if this is set to false, youll have to manually add your messages the same way we do with the drawings
      // THIS IS SET TO FALSE BY DEFAUT
      const OPEN_FOR_DIRECT = false;
  
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
```
Once you've done that, simply pick the worker code from the module you want and paste it in between the two comment sections you can delete the comments if you want!

If you're using multiple modules, just paste them one after the other between the two comment boxes. The order doesn't matter!

Once you have the code compiled into one document, you're going to go to the top right of the page where it says "Edit code", paste in your Worker code, and click "Deploy". You're all set here!

### Adding your secrets

This is where your GitHub token comes in. Did you keep it secret? Keep it safe? In the Worker settings, look for "Settings" → "Variables and Secrets" and click "Add+". You need to add three secrets:

- `GITHUB_TOKEN` - the token you saved from the GitHub section
- `GITHUB_USER` - your GitHub username
- `GITHUB_REPO` - the name of the repo you created

Click "Add variable" for each one, make sure to set the token as "Secret" not "Text" so Cloudflare hides it... ask me how I know.

To be clear, the names of each secret should be EXACTLY as they're written here, all caps and everything. They act as variables in the code, so their spelling and capitalization have to be consistent.

Ok, so you have your secrets, your Worker, and your GitHub all set up you can FINALLY get to your Nekoweb page and start messing around with each module!

---
## Actually Using the Modules

So the first thing you want to set up on your Nekoweb page is the config.js Once you do one any page that uses a module make sure you call it with `<script src="config.js"></script>`
I'll go ahead and explain the file a bit: 

```js
const CONFIG = {
    workerUrl: "https://YOUR-WORKER.URL-HERE.workers.dev",
    emojis: {
        // if you want your guestbook to have emotes, here is where you add them, use these as examples
        "\\[wave\\]": "path/to/your/wave.gif",
        "\\[heart\\]": "path/to/your/heart.gif",
    },
    drawboxColors: [
        "#000000", // black
        "#ffffff", // white
        "#ff6b6b", // red
        "#ffa94d", // orange
        "#ffd43b", // yellow
        "#69db7c", // green
        "#4dabf7", // blue
        "#da77f2", // purple
        "#f783ac", // pink
        "#868e96", // grey
        //add your own hex colors here and customize them
    ]
}
```
You'll want to set up the config with your Worker URL and add it to your files. The palette is for if you're using the drawbox it's just a basic palette, you can customize it any way you want. The emojis are for if you want to use emotes in your guestbook!

As for the modules, each one has a `.js` and a `.css` file to go with it. Edit the CSS file to fit your site's aesthetic, the JS should have everything set up so you just make a div with the relevant id. 

Here is an example HTML with each module set up:
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>my site</title>
    <!-- make sure to add the css for the modules you are using -->
    <!-- delete the ones you dont need -->
    <link rel="stylesheet" href="blog/blog.css">
    <link rel="stylesheet" href="guestbook/guestbook.css">
    <link rel="stylesheet" href="drawbox/drawbox.css">
</head>

<body>

    <!-- ============================================================ -->
    <!-- BLOG MODULE                                                   -->
    <!-- this is actuall ALL you need for the blog to show up          -->
    <!-- ============================================================ -->
    <div id="blog-tag-filter" class="blog-tag-filter-strip"></div>
    <div id="blog-posts"></div>


    <!-- ============================================================ -->
    <!-- GUESTBOOK MODULE                                              -->
    <!-- guestbook needa  little bit more in the divs,                 -->
    <!--  but overall is pretty compact                                -->
    <!-- ============================================================ -->
    <div id="guestbook-messages"></div>
    <input id="guest-name" type="text" placeholder="your name (optional)">
    <textarea id="guest-msg" placeholder="leave a message!"></textarea>
    <!-- do not remove the honeypot, it helps prevent spam! -->
    <input id="honeypot" type="text" style="display:none;" tabindex="-1" autocomplete="off">
    <p id="guestbook-status"></p>
    <button id="send-btn">send</button>


    <!-- ============================================================ -->
    <!-- DRAWBOX MODULE                                                -->
    <!-- this is divided into a few parts so you have more             -->
     <!-- control over how you want it set up                          -->
    <!-- ============================================================ -->

    <!-- colour palette -->
    <div id="swatch-grid"></div>

    <!-- rgb sliders -->
    <div>
        <label>R</label>
        <input id="r-slider" type="range" min="0" max="255" value="0">
        <span id="r-val">0</span>
    </div>
    <div>
        <label>G</label>
        <input id="g-slider" type="range" min="0" max="255" value="0">
        <span id="g-val">0</span>
    </div>
    <div>
        <label>B</label>
        <input id="b-slider" type="range" min="0" max="255" value="0">
        <span id="b-val">0</span>
    </div>

    <!-- colour preview -->
    <div id="colour-preview"></div>

    <!-- the canvas -->
    <canvas id="draw-canvas" width="400" height="400"></canvas>

    <!-- drawing tools -->
    <input id="draw-size" type="range" min="1" max="30" value="5">
    <button id="draw-eraser">Eraser</button>
    <button id="draw-clear">Clear</button>

    <!-- submission stuff -->
    <input id="draw-author" type="text" placeholder="your name (optional)">
    <p id="draw-status"></p>
    <button id="draw-submit">Submit Drawing</button>

    <!-- gallery -->
    <div id="drawings-grid"></div>


    <!-- ============================================================ -->
    <!-- SCRIPTS                                                       -->
    <!-- config.js HAS to be called first!!!!                          -->
    <!-- ============================================================ -->
    <script src="config.js"></script>

    <!-- add only the modules you are using, delete any other one -->
    <script src="blog/blog.js"></script>
    <script src="guestbook/guestbook.js"></script>
    <script src="drawbox/drawbox.js"></script>

    <!-- this will start each module, so on any page you want to use them -->
    <!-- you ahve to actually initialize them -->
    <script>
        initBlog();
        initGuestbook();
        initDrawbox();
    </script>
</body>
</html>
```
