import { useEffect, useState, lazy } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "../Globals.ts";
import { useSelector } from "react-redux";
import { RootState } from "../store.ts";


export default function Logout() {
    const { sendJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [dialogLogoutSuccessOpenState, setDialogLogoutSuccessOpenState] = useState(false);

    const { handleQuit } = globals.useLogoutSession();
    const loginUsername = useSelector((state: RootState) => state.loginUsername);
    const sessionToken = useSelector((state: RootState) => state.sessionToken);

    useEffect(() => {
        handleQuit();
        globals.handleLogout(sendJsonMessage, loginUsername.value, sessionToken.value);
        setDialogLogoutSuccessOpenState(true);
    }, []);

    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate("/home");
    };

    return <>
        <PopupDialog
            open={dialogLogoutSuccessOpenState}
            setPopupDialogOpenState={setDialogLogoutSuccessOpenState}
            text="Logout Successfully. Navigating to Home Page..."
            onClose={handleGoHome} />
    </>;
}