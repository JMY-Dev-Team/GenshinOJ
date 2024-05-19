import { Outlet } from "react-router-dom";

import {
    FluentProvider,
    webLightTheme
} from "@fluentui/react-components";

import NavBar from "./Navbar";

import "../css/style.css";
import useWebSocket from "react-use-websocket";

export default function Root() {
    const {
        sendJsonMessage,
        lastJsonMessage,
		readyState
    } = useWebSocket("ws://" + location.host + "/wsapi", { 
		share: true, 
		shouldReconnect: (closeEvent) => true,
		reconnectAttempts: 10,
		reconnectInterval: 3000
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