import "../css/style.css";
import React, { useCallback, useEffect, useState } from "react";
import { useLoaderData, useOutletContext } from "react-router-dom";
import * as globals from "./Globals"
import { Input, Button, Field } from "@fluentui/react-components";

interface ChatMessage {
    message: string;
    fromMe: boolean;
}

function ChatMessageFetcher({ chatMessageList, setChatMessageList, fromUsername, lastJsonMessage, chatMessageLoaded, setChatMessageLoaded }: {
    chatMessageList: ChatMessage[];
    setChatMessageList: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    fromUsername: string;
    lastJsonMessage: unknown;
    chatMessageLoaded: boolean;
    setChatMessageLoaded: React.Dispatch<React.SetStateAction<boolean>>;
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
            interface ChatMessageFromFetch {
                type: string;
                from: string;
                content: string;
            }

            function isChatMessageFromFetch(x: object) {
                return 'type' in x && 'from' in x && 'content' in x;
            }

            if (_message && isChatMessageFromFetch(_message)) {
                const message = _message as ChatMessageFromFetch;
                console.log(message);
                if (message.type === "chat_message" && message.from === fromUsername) {
                    changed = true;
                    newChatMessageList.push(({ message: (message.content as string), fromMe: false } as ChatMessage));
                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (changed) setChatMessageList(chatMessageList.concat(newChatMessageList));
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, fromUsername, chatMessageList, setChatMessageList]);

    useEffect(() => {
        if(!chatMessageLoaded)
        {
            console.log("Loading local storage (%s)...", "chatMessageTo" + fromUsername);
            setLocalStorageChatMessageList(JSON.parse(localStorage.getItem("chatMessageTo" + fromUsername) as string));
            setChatMessageLoaded(true);
            console.log("Loaded local storage (%s)...", "chatMessageTo" + fromUsername);
        }
    }, [fromUsername, setChatMessageLoaded, chatMessageLoaded]); // Sync from old

    useEffect(() => {
        setChatMessageList(localStorageChatMessageList)
    }, [localStorageChatMessageList, setChatMessageList]);

    useEffect(() => {
        if (chatMessageLoaded) localStorage.setItem("chatMessageTo" + fromUsername, JSON.stringify(chatMessageList))
    }, [chatMessageList, fromUsername, chatMessageLoaded]); // Write new to old

    return <div></div>;
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

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleCliCkClearLocalStorageChatMessageList = useCallback(() => {
        localStorage.setItem("chatMessageTo" + toUsername, JSON.stringify([])); // Clear
        setChatMessageLoaded(false); // Force refresh
    }, [toUsername]);

    const handleClickSendChatMessage = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "chat_user",
            content: {
                from: globals.fetchData("loginUsername"),
                to: toUsername,
                messages: chatMessageToSend as string,
                session_token: globals.fetchData("sessionToken"),
                request_key: _requestKey,
            }
        });

        setChatMessageToSend("");
        setChatMessageList(chatMessageList.concat({ message: chatMessageToSend, fromMe: true } as ChatMessage));
        return _requestKey;
    }, [toUsername, chatMessageToSend, sendJsonMessage, chatMessageList]);

    return <div style={{ display: "block" }}>
        <div style={{ overflowX: "auto", height: "200px" }}>
            <div style={{ display: "flex", flexDirection: "column", flexWrap: "wrap", width: "fill" }}>
                {
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
        <ChatMessageFetcher
            chatMessageList={chatMessageList}
            setChatMessageList={setChatMessageList}
            fromUsername={toUsername as string}
            lastJsonMessage={lastJsonMessage}
            chatMessageLoaded={chatMessageLoaded}
            setChatMessageLoaded={setChatMessageLoaded} />
    </div>;
}

import "../css/chatBubble.css"

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