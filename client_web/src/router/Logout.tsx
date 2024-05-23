import * as globals from "./Globals.ts";
import { useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";

export default function Logout() {
    const { sendJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const handleQuit = useCallback(() => {
        const request_key = globals.randomUUID();
        sendJsonMessage({
            type: "quit",
            content: {
                username: globals.fetchData("loginUsername"),
                session_token: globals.fetchData("sessionToken"),
                request_key: request_key
            }
        });
        globals.clearCache("@all");
    }, [sendJsonMessage]);
    useEffect(() => {
        handleQuit();
    }, [handleQuit])

    return <></>;
}