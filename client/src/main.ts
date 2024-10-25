import {
    JSONMessageHandler,
    reconnectLinear,
    resetSocketListeners,
    setDisconnectHandlers,
    setMessageListeners,
    SimpleMessageHandler,
    socket,
    socketFirstOpen,
} from "./networking.ts";
import "./style.css";

const app = document.getElementById("app")! as HTMLDivElement;

const pingText = document.createElement("p").appendChild(new Text("???ms"));
app.appendChild(pingText.parentElement!);
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
app.appendChild(button);
button.innerText = "Send Stuff";
button.onclick = () =>
    socket.send(JSON.stringify({ randomData: Math.random() }));
const randomDataListener = new JSONMessageHandler(
    function (this: JSONMessageHandler<{ moreRandomData: number }>) {
        console.table(this.data);
    },
);

const disconnectedDialog = document.getElementById(
    "disconnected-dialog",
)! as HTMLDivElement;
{
    disconnectedDialog.style.opacity = "0";

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
        reconnectLinear(() => {
            app.style.opacity = "100%";
            disconnectedDialog.style.opacity = "0";
            resetSocketListeners();
            pingSocket();
        }),
);
