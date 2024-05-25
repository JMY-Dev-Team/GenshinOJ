import * as globals from "./Globals.ts";
import { useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

export default function Logout() {
    const { sendJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const handleQuit = useCallback(() => {
        if (globals.fetchData("isLoggedIn") === true) {
            sendJsonMessage({
                type: "quit",
                content: {
                    username: globals.fetchData("loginUsername"),
                    session_token: globals.fetchData("sessionToken"),
                    request_key: globals.randomUUID(),
                }
            });
            globals.clearCache("@all");
            globals.setData("isLoggedIn", false);
        }

    }, [sendJsonMessage]);
    useEffect(() => {
        handleQuit();
    }, [handleQuit])

    return <></>;
}