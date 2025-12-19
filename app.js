const input = document.getElementById('terminal-input');
const output = document.getElementById('terminal-output');
const promptSection = document.getElementById('prompt-section');
const cursor = document.querySelector('.cursor');

const ADMIN_HASH = atob("YWRtaW4xMjM=");
let currentState = 'NORMAL'; // NORMAL, PASSWORD
let isAdmin = false;

// Initial static data
const STATIC_DATA = {
    social: [
        { name: 'GitHub', url: 'https://github.com' },
        { name: 'Twitter', url: 'https://twitter.com' },
        { name: 'LinkedIn', url: 'https://linkedin.com' }
    ],
    articles: [
        { title: 'The Future of AI Coding', status: 'Liked', url: '#' }
    ],
    videos: [
        { title: '90s Tech Nostalgia', status: 'Liked', url: '#' }
    ]
};

// Load from localStorage or use defaults
function getData() {
    const stored = localStorage.getItem('terminal_data');
    if (stored) {
        return JSON.parse(stored);
    }
    return STATIC_DATA;
}

function saveData(data) {
    localStorage.setItem('terminal_data', JSON.stringify(data));
}

let DATA = getData();

const COMMANDS = {
    help: () => {
        let helpText = `Available commands: 
- <span class="keyword">social</span>: Display social media links
- <span class="keyword">articles</span>: List my articles
- <span class="keyword">videos</span>: List interesting videos
- <span class="keyword">clear</span>: Clear the terminal
- <span class="keyword">whoami</span>: About me
- <span class="keyword">admin</span>: Login to manage content`;

        if (isAdmin) {
            helpText += `\n<span class="keyword">--- ADMIN COMMANDS ---</span>
- <span class="keyword">add &lt;type&gt; &lt;title&gt; &lt;url&gt;</span>: Add (type: article/video)
- <span class="keyword">logout</span>: Logout of admin mode`;
        }
        return helpText;
    },
    social: () => DATA.social.map(s => `[<span class="url" onclick="window.open('${s.url}')">${s.name}</span>]`).join('  '),
    articles: () => DATA.articles.map((a, i) => `${i + 1}. [${a.status || 'Link'}] <span class="url" onclick="window.open('${a.url}')">${a.title}</span>`).join('\n'),
    videos: () => DATA.videos.map((v, i) => `${i + 1}. [${v.status || 'Link'}] <span class="url" onclick="window.open('${v.url}')">${v.title}</span>`).join('\n'),
    whoami: () => `I'm a programmer with a passion for vintage aesthetics and modern code. Welcome to my digital terminal.`,
    admin: () => {
        if (isAdmin) return "Already logged in as admin.";
        currentState = 'PASSWORD';
        input.type = 'password';
        return "Enter password:";
    },
    logout: () => {
        isAdmin = false;
        return "Logged out.";
    },
    clear: () => {
        const lines = output.querySelectorAll('.command-line, .command-output');
        lines.forEach(line => line.remove());
        return null;
    },
    add: (args) => {
        if (!isAdmin) return "Permission denied. Please log in using 'admin'.";
        if (args.length < 3) return "Usage: add &lt;type&gt; &quot;title&quot; &lt;url&gt;";

        const type = args[0].toLowerCase();
        const url = args[args.length - 1];
        const rawTitle = args.slice(1, -1).join(' ').replace(/"/g, '');
        const title = rawTitle.replace(/[&<>"']/g, (m) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m]);

        if (type === 'article' || type === 'articles') {
            DATA.articles.push({ title, url, status: 'Added' });
        } else if (type === 'video' || type === 'videos') {
            DATA.videos.push({ title, url, status: 'Added' });
        } else {
            return "Invalid type. Use 'article' or 'video'.";
        }

        saveData(DATA);
        return `Successfully added ${type}: ${title}`;
    }
};

async function bootSequence() {
    const lines = [
        "Initializing BIOS...",
        "Memory Check: 640KB OK",
        "Loading Kernel...",
        "Starting Terminal Interface...",
        "Welcome, User. Type 'help' to begin."
    ];

    for (const line of lines) {
        await typeOutput(line, 'command-output', 30);
        await new Promise(r => setTimeout(r, 100));
    }
}

function typeOutput(text, className, speed = 20) {
    return new Promise(resolve => {
        const div = document.createElement('div');
        div.className = className;
        output.insertBefore(div, promptSection);

        let i = 0;
        const interval = setInterval(() => {
            div.innerHTML += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(interval);
                resolve();
            }
            output.scrollTop = output.scrollHeight;
        }, speed);
    });
}

function handleCommand(cmd) {
    const parts = cmd.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) || [];
    const commandName = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    // Echo command (mask password)
    const echoLine = document.createElement('div');
    echoLine.className = 'command-line';
    echoLine.innerHTML = '<span class="prompt">guest@terminal:~$</span> ';
    const commandNode = document.createTextNode(currentState === 'PASSWORD' ? '********' : cmd);
    echoLine.appendChild(commandNode);
    output.insertBefore(echoLine, promptSection);

    if (currentState === 'PASSWORD') {
        if (cmd === ADMIN_HASH) {
            isAdmin = true;
            appendOutput("Authentication successful. Welcome, admin.");
        } else {
            appendOutput("Authentication failed.", "error");
        }
        currentState = 'NORMAL';
        input.type = 'text';
        return;
    }

    if (COMMANDS[commandName]) {
        const result = COMMANDS[commandName](args);
        if (result) {
            appendOutput(result);
        }
    } else if (cmd.trim()) {
        appendOutput(`Command not found: ${commandName}. Type 'help' for available commands.`, "error");
    }

    output.scrollTop = output.scrollHeight;
}

function appendOutput(html, className = "command-output") {
    const outputLine = document.createElement('div');
    outputLine.className = className;
    outputLine.innerHTML = html;
    output.insertBefore(outputLine, promptSection);
}

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = input.value;
        handleCommand(cmd);
        input.value = '';
    }
});

document.addEventListener('click', () => input.focus());
bootSequence();
