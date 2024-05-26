import * as globals from "./Globals.ts";
import { useEffect, useCallback, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import PopupDialog from "./PopupDialog.tsx";

export default function Logout() {
    const { sendJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [dialogLogoutSuccessOpenState, setDialogLogoutSuccessOpenState] = useState(false);
    const navigate = useNavigate();
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

        setDialogLogoutSuccessOpenState(true);

    }, [sendJsonMessage]);

    useEffect(() => {
        handleQuit();
    }, [handleQuit])

    return <>
    <PopupDialog
        open={dialogLogoutSuccessOpenState}
        setPopupDialogOpenState={setDialogLogoutSuccessOpenState}
        text="Logout Successfully. Navigating to Root Page..."
        onClose={() => { navigate("/"); }} />
    </>;
}