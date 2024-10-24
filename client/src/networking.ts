export let socket = new WebSocket("ws://" + location.hostname + ":8000");
console.log(location.hostname);
socket.onclose = onClose;

export function reconnectLinear(onReopen: () => unknown, timeout = 1) {
    setTimeout(() => {
        if (socket.readyState == socket.OPEN) return;
        socket = new WebSocket("ws://" + location.hostname + ":8000");
        socket.onopen = onReopen;
        socketFirstOpen
            .then(() => {
                socket.onclose = onClose;
                onReopen();
            })
            .catch(() => reconnectLinear(onReopen, timeout + 1));
    }, timeout * 1_000);
}

export const socketFirstOpen = new Promise<void>((res, rej) => {
    socket.onopen = () => {
        res();
    };
    socket.onerror = (e) => {
        console.error(e);
        rej(e);
    };
});

export interface MessageHandler {
    match(data: string): boolean;
    handle: () => unknown;
}

export class SimpleMessageHandler implements MessageHandler {
    constructor(
        public specifier: string,
        public handle: () => unknown,
    ) {}

    match(data: string) {
        return data == this.specifier;
    }
}

export class JSONMessageHandler<T> implements MessageHandler {
    // @ts-ignore:
    data: T;
    handle: (this: JSONMessageHandler<T>) => unknown;

    constructor(
        handle: (this: JSONMessageHandler<T>) => unknown,
    ) {
        this.handle = handle;
    }

    match(data: string) {
        this.data = JSON.parse(data) as T;
        return true;
    }
}

const messageHandlers: MessageHandler[] = [];
export function setMessageListeners(...handlers: MessageHandler[]) {
    messageHandlers.splice(0, messageHandlers.length);
    for (let i = 0; i < handlers.length; i++) messageHandlers.push(handlers[i]);
}

export function resetSocketListeners() {
    socket.onmessage = (event) => {
        for (let i = 0; i < messageHandlers.length; i++) {
            if (messageHandlers[i].match(event.data)) {
                return messageHandlers[i].handle();
            }
        }
    };
}
resetSocketListeners();

type DisconnectHandler = () => unknown;
const closeHandlers: DisconnectHandler[] = [];
export function setDisconnectHandlers(...handlers: DisconnectHandler[]) {
    closeHandlers.splice(0, closeHandlers.length);
    for (let i = 0; i < handlers.length; i++) closeHandlers.push(handlers[i]);
}
function onClose() {
    for (let i = 0; i < closeHandlers.length; i++) closeHandlers[i]();
}
