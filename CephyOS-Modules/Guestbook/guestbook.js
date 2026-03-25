// guestbook module - displays and submits guestboook messages with some security and filtering
// requires: config.js to be loaded first
// the guestbook will only post your approved messages, there are also limits to how long, how short, and waht language cna be included in the message


let lastPostTime = 0; 

function initGuestbook() {
    const container = document.getElementById("guestbook-messages");
    if (!container) return;
    initSendButton();
    loadMessages();
}

//this is important- you gotta make sure no one can just execute code through your text box
function sanitizeText(text) {
    const div = document.createElement('div');
    div.textContent = text; 
    return div.innerHTML;
}

// the MOST important function: Emojis lmao
// emojis have css sytling that cna be changed here, im just using mine 
function parseEmojis(text) {
    const emojiMap = CONFIG.emojis || {};
    let formattedText = text;
    for (const [code, url] of Object.entries(emojiMap)) {
        const regex = new RegExp(code, 'g');
        formattedText = formattedText.replace(regex, `<img src="${url}" style="width:20px; vertical-align:middle;">`);
    }
    return formattedText;
}


//this is the function that will, in fact, load your guestbook messages
async function loadMessages() {
    const msgContainer = document.getElementById("guestbook-messages");
    if (!msgContainer) return;
    try {
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'listGuest' }),
        });
        const data = await res.json();
        const entries = data.entries || [];
        msgContainer.innerHTML = "";
        if (!entries.length) {
            msgContainer.innerHTML = '';
            return;
        }
        [...entries].forEach(entry => {
            msgContainer.scrollTop = msgContainer.scrollHeight;
            const div = document.createElement("div");
            div.className = 'guestbook-entry';
            // if someone doesnt put their name in will be anon 
            const name = sanitizeText(entry.name || 'Anonymous');
            // the date will be saved with the message
            const date = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            // this checks teh text for emotes
            const message = parseEmojis(sanitizeText(entry.message || ''));
            //heres teh actual container with your messages
            div.innerHTML = `
            <strong>${name}</strong>
            <span class="guestbook-date">· ${date}</span>
            <p>${message}</p>
            `;
            msgContainer.appendChild(div);
        });
    } catch (e) {
        msgContainer.innerHTML = '<p> Messages not loading!</p>';
    }
}

//heres your send button 
function initSendButton() {
    const sendBtn = document.getElementById("send-btn");
    if (!sendBtn) return;
    const status = document.getElementById("guestbook-status");
    sendBtn.addEventListener("touchend", (e) => { e.preventDefault(); sendBtn.click(); });
    sendBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        //heres that security thing, if a bot tries to submit something with a value here, they wont get an error itll just quietly fail
        if (document.getElementById("honeypot")?.value !== "") return;
        const now = Date.now();
        if (now - lastPostTime < 2000) { if (status) status.textContent = "too fast!"; return; }
        const nameInput = document.getElementById("guest-name");
        const msgInput = document.getElementById("guest-msg");
        if (!msgInput.value.trim()) { if (status) status.textContent = "cant be blank bro!"; return; }
        lastPostTime = now;
        try {
            const res = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'submitMail', name: nameInput.value.trim(), message: msgInput.value }),
            });
            const data = await res.json();
            if (data.ok) {
                msgInput.value = "";
                if (status) status.textContent = "Message sent! It'll appear once approved!!";
            } else {
                if (status) status.textContent = "Error: " + (data.error || "Something went wrong");
            }
        } catch (err) {
            console.error("Error sending:", err);
        }
        loadMessages();
    });
}