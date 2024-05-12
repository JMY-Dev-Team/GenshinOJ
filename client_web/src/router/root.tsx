import { Outlet } from "react-router-dom";

import {
    FluentProvider,
    webLightTheme
} from "@fluentui/react-components";

import NavBar from "./Navbar";

import "../css/style.css";
import { useState } from "react";
import useWebSocket from "react-use-websocket";

export default function Root() {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    const {
        sendJsonMessage,
        lastJsonMessage,
    } = useWebSocket("ws://" + location.host + "/wsapi", { share: true });
    return (
        <FluentProvider theme={webLightTheme}>
            <NavBar />
            <div>
                <Outlet context={{ sendJsonMessage, lastJsonMessage, websocketMessageHistory, setWebsocketMessageHistory }} />
            </div>
        </FluentProvider>
    );
}