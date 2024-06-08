import { useEffect, useCallback, useState, lazy } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "../Globals.ts";
import { RootState } from "../store.ts";
import { logoutReducer } from "../../redux/loginStatusSlice.ts";
import { clearLoginUsernameReducer } from "../../redux/loginUsernameSlice.ts";
import { clearSessionTokenReducer } from "../../redux/sessionTokenSlice.ts";

export default function Logout() {
    const { sendJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [dialogLogoutSuccessOpenState, setDialogLogoutSuccessOpenState] = useState(false);
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const loginUsername = useSelector((state: RootState) => state.loginUsername);
    const sessionToken = useSelector((state: RootState) => state.sessionToken);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const handleQuit = useCallback(() => {
        if (loginStatus.value === true) {
            sendJsonMessage({
                type: "quit",
                content: {
                    username: loginUsername.value,
                    session_token: sessionToken.value,
                    request_key: globals.randomUUID(),
                }
            });

            dispatch(logoutReducer());
            dispatch(clearLoginUsernameReducer());
            dispatch(clearSessionTokenReducer());
        }

        setDialogLogoutSuccessOpenState(true);
    }, [sendJsonMessage]);

    useEffect(() => {
        handleQuit();
    }, [handleQuit]);

    const handleGoHome = useCallback(() => {
        navigate("/home");
    }, [navigate]);

    return <>
        <PopupDialog
            open={dialogLogoutSuccessOpenState}
            setPopupDialogOpenState={setDialogLogoutSuccessOpenState}
            text="Logout Successfully. Navigating to Home Page..."
            onClose={handleGoHome} />
    </>;
}