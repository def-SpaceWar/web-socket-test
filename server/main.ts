import { serveDir } from "@std/http/file-server";

Deno.serve({
    // can be async too!
    handler(request) {
        if (request.headers.get("upgrade") != "websocket") {
            if (new URL(request.url).pathname.startsWith("/server")) {
                return new Response("Not Found", { status: 404 });
            }
            return serveDir(request, {
                fsRoot: "./",
            });
        }

        const { socket, response } = Deno.upgradeWebSocket(request);

        socket.onopen = () => {
            console.log("a client CONNECTED");
        };
        socket.onmessage = (event) => {
            if (event.data == "ping") return socket.send("ping");
            console.log(`RECEIVED: ${event.data}`);
            socket.send(JSON.stringify({ moreRandomData: Math.random() }));
        };
        socket.onclose = () => console.log("a client DISCONNECTED");
        socket.onerror = (error) => console.error("an ERROR:", error);

        return response;
    },
});
