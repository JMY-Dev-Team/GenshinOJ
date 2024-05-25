import { Outlet } from "react-router-dom";

import {
    FluentProvider,
    webLightTheme
} from "@fluentui/react-components";

import NavBar from "./Navbar";

import "../css/style.css";
import useWebSocket from "react-use-websocket";
import * as globals from "./Globals"

export default function Root() {
    const {
        sendJsonMessage,
        lastJsonMessage,
        readyState
    } = useWebSocket("ws://" + location.host + "/wsapi", {
        share: true,
        shouldReconnect: () => true,
        reconnectAttempts: 10,
        reconnectInterval: 3000,
        onClose: () => {
            if (globals.fetchData("isLoggedIn")) {
                sendJsonMessage({
                    type: "quit",
                    content: {
                        username: globals.fetchData("loginUsername"),
                        session_token: globals.fetchData("sessionToken"),
                        request_key: globals.randomUUID()
                    }
                });
                globals.setData("isLoggedIn", false);
            }
        },
    });

    return (
        <FluentProvider theme={webLightTheme}>
            <NavBar />
            <div>
                <Outlet context={{ sendJsonMessage, lastJsonMessage, readyState }} />
            </div>
        </FluentProvider>
    );
}