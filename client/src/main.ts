import {
    JSONMessageHandler,
    reconnectExponential,
    resetSocketListeners,
    setDisconnectHandlers,
    setMessageListeners,
    SimpleMessageHandler,
    socket,
    socketFirstOpen,
} from "./networking.ts";
import "./style.css";

const app = document.getElementById("app")! as HTMLDivElement;

const pingText = app.appendChild(
    document.createElement("p").appendChild(new Text("???ms")),
);
pingText.parentElement!.id = "ping";
let before = 0, ping = 0;
function pingSocket() {
    before = performance.now();
    socket.send("ping");
}
const pingListener = new SimpleMessageHandler("ping", () => {
    ping = performance.now() - before;
    pingText.textContent = ping + "ms";
    setTimeout(pingSocket, 5_000);
});

const button = app.appendChild(document.createElement("button"));
button.innerText = "Send Stuff";
button.onclick = () =>
    socket.send(JSON.stringify({ randomData: Math.random() }));
const randomDataListener = new JSONMessageHandler(
    function (this: JSONMessageHandler<{ moreRandomData: number }>) {
        console.table(this.data);
    },
);

const disconnectedDialog = document.body.appendChild(
    document.createElement("div"),
);
{
    disconnectedDialog.style.opacity = "0";
    disconnectedDialog.id = "disconnected-dialog";

    const heading = disconnectedDialog.appendChild(
        document.createElement("h1"),
    );
    heading.textContent = "Disconnected";

    const message = disconnectedDialog.appendChild(document.createElement("p"));
    message.textContent = "Refresh/reload the tab to reconnect.";
}

const myDisconnectHandler = () => {
    app.style.opacity = "0";
    disconnectedDialog.style.opacity = "100%";
};

socketFirstOpen.then(() => {
    pingSocket();
});

setMessageListeners(
    pingListener,
    randomDataListener,
);

setDisconnectHandlers(
    myDisconnectHandler,
    () =>
        reconnectExponential(() => {
            app.style.opacity = "100%";
            disconnectedDialog.style.opacity = "0";
            resetSocketListeners();
            pingSocket();
        }),
);
