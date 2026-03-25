// this is your basic config file, the information at the top youll want to fill in with your GitHUb info
const CONFIG = {
    githubUser: "YOUR USER",
    githubRepo: "YOUR REPO",
    workerUrl: "https://YOUR.WORKER.workers.dev",
    // you dont need custon emoji in your guestbook, but if you wanted it, 
    // this is how you would add them, this can be left unused or commented out
    emojis: {
        "\\[wave\\]": "path/to/your/wave.gif",
        "\\[heart\\]": "path/to/your/heart.gif",
    },
    //colorsfor your drawbox, i added some basic colors here- but your palette can be 
    // as big and comples or simple as u want, be free 
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
const WORKER_URL = CONFIG.workerUrl;
