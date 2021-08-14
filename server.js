const fs = require("fs");
const http = require("http");
const ws = require("websocket");
const open = require("open");

const onlisten = () => {
    console.log("Watching 'index.html' on port 8080");
    open("http://localhost:8080", { wait: false });
}

const injection = 
`<script>
(function connect() {
    var ws = new WebSocket("ws://localhost:8080");
    ws.onmessage = e => "reload" === e.data && window.location.reload();
    ws.onclose = connect;
})();
</script>`;

const socket = new ws.server({
    httpServer: http
        .createServer((req, res) => {
            if (req.url?.endsWith("/") || req.url?.endsWith("/index.html")) {
                const file = fs.readFileSync("./index.html" , "utf-8");
                const head = file.indexOf("</head>")
                res.writeHead(200);
                res.end(file.substring(0, head) + injection + file.substring(head), "utf-8");
            } else {
                res.writeHead(404);
                res.end();
            }
        })
        .listen(8080, onlisten),
    autoAcceptConnections: true
});

let prev = fs.readFileSync("./index.html");
fs.watch("./index.html", "utf-8", (evt) => {
    if (evt !== "change") return;
    const content = fs.readFileSync("./index.html");
    if (prev === content) return;
    prev = content;
    
    socket.connections.forEach(conn => conn.sendUTF("reload"));
});