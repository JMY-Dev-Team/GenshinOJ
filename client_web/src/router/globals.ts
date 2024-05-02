import * as syncWebsocket from "./syncWebsocket";

var isLoggedIn = false;

export function setIsLoggedIn(__isLoggedIn: boolean) {
    isLoggedIn = __isLoggedIn;
}

export function getIsLoggedIn(): boolean {
    return isLoggedIn;
}

let mainWebsocketProtocol: syncWebsocket.SyncWebSocket;

export function setMainWebsocketProtocol(
    __mainWebsocketProtocol: syncWebsocket.SyncWebSocket
) {
    mainWebsocketProtocol = __mainWebsocketProtocol;
}

export function getMainWebsocketProtocol(): syncWebsocket.SyncWebSocket {
    return mainWebsocketProtocol;
}

export async function getOnlineUsersList() {
    const request_key = crypto.randomUUID();
    let onlineUsers;
    await getMainWebsocketProtocol().send(request_key, {
        type: "online_user",
        content: {
            request_key: request_key
        }
    })
    .then((result_: MessageEvent) => {
        console.log(result_.data);
        if(JSON.parse(result_.data)['type'] != "online_user") return;
        onlineUsers = JSON.parse(result_.data)['content']["online_users"];
    });

    return onlineUsers;
}

export async function loginSession(
    loginUsername: string,
    loginPassword: string
) {
    const request_key = crypto.randomUUID();
    setMainWebsocketProtocol(
        new syncWebsocket.SyncWebSocket("ws://localhost:9982")
    );
    const result__ = await getMainWebsocketProtocol().open();
    await getMainWebsocketProtocol()
        .send(request_key, {
            type: "login",
            content: {
                username: loginUsername,
                password: loginPassword,
                request_key: request_key,
            },
        })
        .then((result_: MessageEvent) => {
            if(JSON.parse(result_.data)["type"] == "session_token")
                setIsLoggedIn(true);
        });

    if (getIsLoggedIn()) return true;
    return false;
}

export async function registerSession(
    registerUsername: string,
    registerPassword: string
) {
    const request_key = crypto.randomUUID();
    setMainWebsocketProtocol(
        new syncWebsocket.SyncWebSocket("ws://localhost:9982")
    );
    const result__ = await getMainWebsocketProtocol().open();
    let result = false;
    await getMainWebsocketProtocol()
        .send(request_key, {
            type: "register",
            content: {
                username: registerUsername,
                password: registerPassword,
                request_key: request_key,
            },
        })
        .then((result_: MessageEvent) => {
            if(JSON.parse(result_.data)["type"] == "quit" && JSON.parse(result_.data)["content"]["reason"] == "registration_success")
                result = true;
        });

    return result;
}
