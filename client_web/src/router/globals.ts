import * as BetterWebSocket from "./BetterWebSocket";

var isLoggedIn = false;

export function setIsLoggedIn(__isLoggedIn: boolean) {
    isLoggedIn = __isLoggedIn;
}

export function getIsLoggedIn(): boolean {
    return isLoggedIn;
}

let mainWebsocketProtocol: BetterWebSocket.BetterWebSocket;

export function setMainWebsocketProtocol(
    __mainWebsocketProtocol: BetterWebSocket.BetterWebSocket
) {
    mainWebsocketProtocol = __mainWebsocketProtocol;
}

export function getMainWebsocketProtocol(): BetterWebSocket.BetterWebSocket {
    return mainWebsocketProtocol;
}

export async function fetchOnlineUsersList() {
    const request_key = randomUUID();
    let onlineUsers = [];
    console.log("Fetching online user list...");
    await getMainWebsocketProtocol().send_sync(request_key, {
        type: "online_user",
        content: {
            request_key: request_key
        }
    }).then((result_: MessageEvent) => {
        console.log(result_.data);
        if (JSON.parse(result_.data)['type'] != "online_user") return;
        onlineUsers = JSON.parse(result_.data)['content']["online_users"];
    });

    console.log("Fetched online user list...");
    return onlineUsers;
}

export async function loginSession(
    loginUsername: string,
    loginPassword: string
) {
    const request_key = randomUUID();
    setMainWebsocketProtocol(
        new BetterWebSocket.BetterWebSocket("ws://" + location.host + "/wsapi")
    );
    await getMainWebsocketProtocol().open();
    await getMainWebsocketProtocol()
        .send_sync(request_key, {
            type: "login",
            content: {
                username: loginUsername,
                password: loginPassword,
                request_key: request_key,
            },
        })
        .then((result_: MessageEvent) => {
            if (JSON.parse(result_.data)["type"] == "session_token")
                setIsLoggedIn(true);
        });

    if (getIsLoggedIn()) return true;
    return false;
}

export async function registerSession(
    registerUsername: string,
    registerPassword: string
) {
    const request_key = randomUUID();
    setMainWebsocketProtocol(
        new BetterWebSocket.BetterWebSocket("ws://" + location.host + "/wsapi")
    );
    await getMainWebsocketProtocol().open();
    let result = false;
    await getMainWebsocketProtocol()
        .send_sync(request_key, {
            type: "register",
            content: {
                username: registerUsername,
                password: registerPassword,
                request_key: request_key,
            },
        })
        .then((result_: MessageEvent) => {
            if (JSON.parse(result_.data)["type"] == "quit" && JSON.parse(result_.data)["content"]["reason"] == "registration_success")
                result = true;
        });

    return result;
}

export function randomUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getProperty(obj: unknown, key: string) {
    if (typeof obj === 'object' && obj !== null) {
        return (obj as { [k: string]: any })[key];
    } else {
        return undefined;
    }
}

let onlineUsersList = []
export function setOnlineUsersList(__onlineUsersList) {
    onlineUsersList = __onlineUsersList;
}

export function getOnlineUsersList() {
    return onlineUsersList;
}

export function wrapPromise(promise) {
    let status = 'pending';
    let response;

    const suspender = promise.then(
        res => {
            status = 'success';
            response = res;
        },
        err => {
            status = 'error';
            response = err;
        },
    );

    const handler = {
        pending: () => {
            throw suspender;
        },
        error: () => {
            throw response;
        },
        default: () => response,
    };

    const read = () => {
        const result = handler[status] ? handler[status]() : handler.default();
        return result;
    };

    return { read };
}