import { useCallback, useEffect, useState, lazy } from "react";
import { useLoaderData, useOutletContext } from "react-router-dom";

import { Input, Button, Field } from "@fluentui/react-components";

import { useSelector } from "react-redux";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "../Globals.ts";
import { RootState } from "../store.ts";

import "../css/style.css";

import "../css/chatBubble.css"

interface ChatMessage {
    message: string;
    fromMe: boolean;
}

interface ChatMessageFromFetch {
    type: string;
    from: string;
    content: string;
}

function isChatMessageFromFetch(x: object) {
    return 'type' in x &&
        'from' in x &&
        'content' in x;
}

interface ChatMessageFromEchoSuccess {
    type: string;
    content: {
        status: number,
        messages: string,
    };
}

function isChatMessageFromEchoSuccess(x: object) {
    return "type" in x &&
        "content" in x &&
        typeof x.content === "object" &&
        x.content !== null &&
        "status" in x.content &&
        "messages" in x.content;
}

interface ChatMessageFromEchoFailure {
    type: string;
    content: {
        status: number,
        reason: string,
    };
}

function isChatMessageFromEchoFailure(x: object) {
    return "type" in x &&
        "content" in x &&
        typeof x.content === "object" &&
        x.content !== null &&
        "status" in x.content &&
        "reason" in x.content;
}

function ChatMessageFetcher({ chatMessageList, setChatMessageList, fromUsername, lastJsonMessage, chatMessageLoaded, setChatMessageLoaded, setDialogChatMessageSendFailureOpenState }: {
    chatMessageList: ChatMessage[];
    setChatMessageList: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    fromUsername: string;
    lastJsonMessage: unknown;
    chatMessageLoaded: boolean;
    setChatMessageLoaded: React.Dispatch<React.SetStateAction<boolean>>;
    setDialogChatMessageSendFailureOpenState: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    const [localStorageChatMessageList, setLocalStorageChatMessageList] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        let changed = false;
        const newChatMessageList: ChatMessage[] = [];
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
            if (_message) {
                if (isChatMessageFromFetch(_message)) {
                    const message = _message as ChatMessageFromFetch;
                    console.log(message);
                    if (message.type === "chat_message" && message.from === fromUsername) {
                        changed = true;
                        newChatMessageList.push(({ message: (message.content as string), fromMe: false } as ChatMessage));
                        delete _websocketMessageHistory[index];
                    }
                }

                if (isChatMessageFromEchoFailure(_message)) {
                    const message = _message as ChatMessageFromEchoFailure;
                    console.log(message);
                    if (message.type === "chat_echo" && message.content.status === 0) {
                        changed = true;
                        setDialogChatMessageSendFailureOpenState(true);
                        delete _websocketMessageHistory[index];
                    }
                }

                if (isChatMessageFromEchoSuccess(_message)) {
                    const message = _message as ChatMessageFromEchoSuccess;
                    console.log(message);
                    if (message.type === "chat_echo" && message.content.status === 1) {
                        changed = true;
                        newChatMessageList.push(({ message: (message.content.messages as string), fromMe: true } as ChatMessage));
                        delete _websocketMessageHistory[index];
                    }
                }
            }
        });

        if (changed) setChatMessageList(chatMessageList.concat(newChatMessageList));
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, fromUsername, chatMessageList, setChatMessageList, setDialogChatMessageSendFailureOpenState]);

    useEffect(() => {
        if (!chatMessageLoaded) {
            console.log("Loading local storage (%s)...", "chatMessageTo" + fromUsername);
            const tmp = localStorage.getItem("chatMessageTo" + fromUsername);
            if (tmp !== null)
                setLocalStorageChatMessageList(JSON.parse(tmp));
            else
                setLocalStorageChatMessageList([]);

            setChatMessageLoaded(true);
            console.log("Loaded local storage (%s)...", "chatMessageTo" + fromUsername);
        }
    }, [fromUsername, setChatMessageLoaded, chatMessageLoaded]);

    useEffect(() => {
        setChatMessageList(localStorageChatMessageList)
    }, [localStorageChatMessageList, setChatMessageList]);

    useEffect(() => {
        if (chatMessageLoaded) localStorage.setItem("chatMessageTo" + fromUsername, JSON.stringify(chatMessageList))
    }, [chatMessageList, fromUsername, chatMessageLoaded]);

    return <></>;
}

interface ChatInfo {
    toUsername: string;
}

export default function ChatMainUser() {
    const { toUsername } = (useLoaderData() as ChatInfo);
    const [, setWebsocketMessageHistory] = useState([]);
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [chatMessageList, setChatMessageList] = useState<ChatMessage[]>([]);
    const [chatMessageToSend, setChatMessageToSend] = useState("");
    const [chatMessageLoaded, setChatMessageLoaded] = useState(false);
    const [dialogChatMessageSendFailureOpenState, setDialogChatMessageSendFailureOpenState] = useState(false);
    const loginUsername = useSelector((state: RootState) => state.loginUsername);
    const sessionToken = useSelector((state: RootState) => state.sessionToken);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleCliCkClearLocalStorageChatMessageList = useCallback(() => {
        localStorage.setItem("chatMessageTo" + toUsername, JSON.stringify([]));
        setChatMessageLoaded(false);
    }, [toUsername]);

    const handleClickSendChatMessage = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "chat_user",
            content: {
                from: loginUsername.value,
                to: toUsername,
                messages: chatMessageToSend as string,
                session_token: sessionToken.value,
                request_key: _requestKey,
            }
        });

        setChatMessageToSend("");
        return _requestKey;
    }, [toUsername, chatMessageToSend, sendJsonMessage]);

    return <>
        <div style={{ display: "block" }}>
            <div style={{ overflowX: "auto", height: "400px" }}>
                <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "fill" }}>
                    {
                        chatMessageList == null
                            ?
                            <></>
                            :
                            chatMessageList.map((message, index) => <div key={index} style={{ alignItems: message.fromMe ? "right" : "left", justifyContent: message.fromMe ? "right" : "left", display: "flex", width: "fill", minHeight: "50px" }}><ChatBubble text={message.message} fromMe={message.fromMe} /></div>)
                    }
                </div>
            </div>
            <div style={{ display: "flex", flexDirection: "row", width: "fill", alignItems: "end" }}>
                <form>
                    <Field label="Input to chat" style={{ maxWidth: "300px", flex: 3 }}>
                        <Input type="text" id="chat-input" value={chatMessageToSend} onChange={(props) => setChatMessageToSend(props.target.value)} />
                    </Field>
                    <Button onClick={handleClickSendChatMessage} style={{ flex: 1 }}>Send</Button>
                </form>
            </div>
            <Button onClick={handleCliCkClearLocalStorageChatMessageList}>Clear Chat Message</Button>
            <PopupDialog
                open={dialogChatMessageSendFailureOpenState}
                setPopupDialogOpenState={setDialogChatMessageSendFailureOpenState}
                text="Chat message send failed." />
            <ChatMessageFetcher
                chatMessageList={chatMessageList}
                setChatMessageList={setChatMessageList}
                fromUsername={toUsername as string}
                lastJsonMessage={lastJsonMessage}
                chatMessageLoaded={chatMessageLoaded}
                setChatMessageLoaded={setChatMessageLoaded}
                setDialogChatMessageSendFailureOpenState={setDialogChatMessageSendFailureOpenState} />
        </div>
    </>;
}

function ChatBubble({ text, fromMe }: {
    text: string;
    fromMe: boolean;
}) {
    if (fromMe)
        return <div className="chat-bubble chat-bubble--me">
            <p style={{ fontSize: "1em", color: "black" }}>{text}</p>
        </div>;
    else
        return <div className="chat-bubble chat-bubble--not-me">
            <p style={{ fontSize: "1em", color: "white" }}>{text}</p>
        </div>;
}