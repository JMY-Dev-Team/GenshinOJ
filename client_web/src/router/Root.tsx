import { useCallback, useEffect, lazy } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";

import useWebSocket from "react-use-websocket";

const NavBar = lazy(() => import("./NavBar.tsx"));

import * as globals from "./Globals.ts";

import "../css/style.css";

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
            if (globals.fetchData("isLoggedIn") === true) {
                console.log("quitting...");
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

    const beforeunload = useCallback((ev: Event) => {
        if (ev) {
            if (globals.fetchData("isLoggedIn") === true) {
                console.log("quitting...");
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
        }
    }, [sendJsonMessage]);

    useEffect(() => {
        window.addEventListener('beforeunload', beforeunload);
    }, [beforeunload]);

    const navigate = useNavigate();
    const nowLocation = useLocation();
    useEffect(() => {
        if (nowLocation.pathname == "/") navigate("/home");
        if (nowLocation.pathname == "/user") navigate("/user/" + globals.fetchData("loginUsername"));
    }, [nowLocation, navigate]);

    return (
        <FluentProvider theme={webLightTheme}>
            <NavBar />
            <div className="react-router-outlet">
                <Outlet context={{ sendJsonMessage, lastJsonMessage, readyState }} />
            </div>
        </FluentProvider>
    );
}