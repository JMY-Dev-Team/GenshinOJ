import { useCallback, useEffect, lazy } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import { FluentProvider, webLightTheme } from "@fluentui/react-components";

import { useSelector, useDispatch } from "react-redux";

import useWebSocket from "react-use-websocket";

const NavBar = lazy(() => import("./NavBar.tsx"));

import * as globals from "../Globals.ts";
import { RootState } from "../store.ts";
import { logoutReducer } from "../../redux/loginStatusSlice.ts";

import "../css/style.css";

export default function Root() {
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const loginUsername = useSelector((state: RootState) => state.loginUsername);
    const sessionToken = useSelector((state: RootState) => state.sessionToken);
    const dispatch = useDispatch();
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
            if (loginStatus.value === true) {
                console.log("quitting...");
                sendJsonMessage({
                    type: "quit",
                    content: {
                        username: loginUsername.value,
                        session_token: sessionToken.value,
                        request_key: globals.randomUUID()
                    }
                });

                dispatch(logoutReducer());
            }
        },
    });

    const beforeunload = useCallback((ev: Event) => {
        if (ev) {
            if (loginStatus.value === true) {
                console.log("quitting...");
                sendJsonMessage({
                    type: "quit",
                    content: {
                        username: loginUsername.value,
                        session_token: sessionToken.value,
                        request_key: globals.randomUUID()
                    }
                });

                dispatch(logoutReducer());
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
        if (nowLocation.pathname == "/user") navigate("/user/" + loginUsername.value);
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