import useWebSocket from "react-use-websocket";
import "../css/style.css";
import { useEffect, useState } from "react";

export default function ChatMainUser() {
    const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);
    const { sendMessage, lastMessage, readyState } = useWebSocket("ws://" + location.host + "/wsapi", { share: true });
    const [chatMessage, setChatMessage] = useState("");
    useEffect(() => {
        if (lastMessage !== null) setMessageHistory((previousMessage) => previousMessage.concat(lastMessage)), console.log(lastMessage);
    }, [lastMessage]);
    return <div>
        {
            messageHistory.map((message, index) => <div key={index}>{message.data}</div>)
        }
        <form>
            <label htmlFor="chat-input">Input to chat</label>
            <input type="text" id="chat-input" onInput={(props) => setChatMessage(props.currentTarget.value)} />
            <input type="submit" value="Send" onClick={(e) => {
                e.preventDefault();
            }} />
        </form>
    </div>;
}