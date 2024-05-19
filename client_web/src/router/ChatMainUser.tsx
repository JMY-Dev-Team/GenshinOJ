import "../css/style.css";
import { useCallback, useEffect, useState } from "react";
import { useLoaderData, useOutletContext } from "react-router-dom";
import * as globals from "./Globals"

function ChatMessageFetcher({ chatMessageList, setChatMessageList, fromUsername, lastJsonMessage }: {
    chatMessageList: string[];
    setChatMessageList: React.Dispatch<React.SetStateAction<string[]>>;
    fromUsername: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        let changed = false;
        const newChatMessageList: string[] = [];
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
            interface ChatMessage {
                type: string;
                from: string;
                content: string;
            }

            function isChatMessage(x: object) {
                return 'type' in x && 'from' in x && 'content' in x;
            }

            if (_message && isChatMessage(_message)) {
                const message = _message as ChatMessage;
                console.log(message);
                if (message.type === "chat_message" && message.from === fromUsername) {
                    changed = true;
                    newChatMessageList.push(message.content);
                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (changed) setChatMessageList(chatMessageList.concat(newChatMessageList));
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, fromUsername, chatMessageList, setChatMessageList]);

    return <div></div>;
}

interface ChatInfo {
    toUsername: string;
}

export default function ChatMainUser() {
    const { toUsername } = (useLoaderData() as ChatInfo);
    const [, setWebsocketMessageHistory] = useState([]);
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [chatMessageList, setChatMessageList] = useState([]);
    const [chatMessageToSend, setChatMessageToSend] = useState("");

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleClickSendChatMessage = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "chat_user",
            content: {
                from: globals.fetchData("loginUsername"),
                to: toUsername,
                messages: chatMessageToSend,
                session_token: globals.fetchData("sessionToken"),
                request_key: _requestKey
            }
        });

        setChatMessageToSend("");
        return _requestKey;
    }, [toUsername, chatMessageToSend, sendJsonMessage]);

    return <>
        <ul>
            {
                chatMessageList.map((message, index) => <li key={index}>{message}</li>)
            }
        </ul>
        <form style={{ verticalAlign: "bottom" }}>
            <label htmlFor="chat-input">Input to chat </label>
            <input type="text" id="chat-input" value={chatMessageToSend} onChange={(props) => setChatMessageToSend(props.target.value)} />
            <input type="button" value="Send" onClick={handleClickSendChatMessage} />
        </form>
        <ChatMessageFetcher
            chatMessageList={chatMessageList}
            setChatMessageList={setChatMessageList as React.Dispatch<React.SetStateAction<string[]>>}
            fromUsername={toUsername as string}
            lastJsonMessage={lastJsonMessage} />
    </>;
}