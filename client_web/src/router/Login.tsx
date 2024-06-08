import { useEffect, useState, lazy, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import { makeStyles, Input, Field, Button } from "@fluentui/react-components";
import { PersonRegular, PasswordRegular } from "@fluentui/react-icons";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import { useSelector, useDispatch } from "react-redux";

import { nanoid } from "nanoid";

import * as globals from "../Globals.ts";

import { loginReducer, logoutReducer } from "../../redux/loginStatusSlice.ts";

import "../css/style.css";
import { RootState } from "../store.ts";
import { modifySessionTokenReducer } from "../../redux/sessionTokenSlice.ts";
import { modifyLoginUsernameReducer } from "../../redux/loginUsernameSlice.ts";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px",
        columnGap: "4px",
        maxWidth: "300px",
        padding: "4px 0 0 12px",
    },
});

function LoginChecker({ setDialogLoginSuccessOpenState, setDialogLoginFailureOpenState, requestKey, loginUsernameFromInput, lastJsonMessage }: {
    setDialogLoginSuccessOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    setDialogLoginFailureOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    requestKey: string;
    loginUsernameFromInput: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    const dispatch = useDispatch();

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
            interface LoginSessionResult {
                type: string;
                content: {
                    request_key: string
                };
            }

            interface LoginSessionResultSuccess extends LoginSessionResult {
                type: string;
                content: {
                    request_key: string,
                    session_token: string
                };
            }

            function isLoginSession(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'request_key' in (x.content as object);
                }

                return false;
            }

            if (_message && isLoginSession(_message)) {
                if ((_message as LoginSessionResult).content.request_key === requestKey) {
                    if ((_message as LoginSessionResult).type === "quit") {
                        setDialogLoginFailureOpenState(true);
                        dispatch(logoutReducer());
                    }
                    if ((_message as LoginSessionResult).type === "session_token") {
                        setDialogLoginSuccessOpenState(true);
                        dispatch(loginReducer());
                        dispatch(modifySessionTokenReducer((_message as LoginSessionResultSuccess).content.session_token));
                        dispatch(modifyLoginUsernameReducer(loginUsernameFromInput));
                    }

                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, requestKey, loginUsernameFromInput, setDialogLoginFailureOpenState, setDialogLoginSuccessOpenState]);

    return <></>;
}

export default function Login() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [requestKey, setRequestKey] = useState("");
    const [loginUsernameFromInput, setLoginUsernameFromInput] = useState("");
    const [loginPasswordFromInput, setLoginPasswordFromInput] = useState("");
    const [dialogLoggedInOpenState, setDialogLoggedInOpenState] = useState(false);
    const [dialogLoginFailureOpenState, setDialogLoginFailureOpenState] = useState(false);
    const [dialogLoginSuccessOpenState, setDialogLoginSuccessOpenState] = useState(false);
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const navigate = useNavigate();

    const handleClickLoginSession = useCallback(() => {
        const _requestKey = nanoid();
        sendJsonMessage({
            type: "login",
            content: {
                username: loginUsernameFromInput,
                password: loginPasswordFromInput,
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [loginUsernameFromInput, loginPasswordFromInput, sendJsonMessage]);

    const handleClickLogin = useCallback(() => {
        setRequestKey(handleClickLoginSession());
    }, [handleClickLoginSession]);

    const handleNavigateBackward = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    useEffect(() => { if (loginStatus.value === true) setDialogLoggedInOpenState(true); }, [loginStatus]);
    return (
        <>
            <div className={useStyles().root}>
                <form>
                    <Field label="Login Username" required>
                        <Input contentBefore={<PersonRegular />}
                            onChange={(props) => setLoginUsernameFromInput(props.target.value)} />
                    </Field>
                    <Field label="Login Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setLoginPasswordFromInput(props.target.value)} />
                    </Field>
                    <Button appearance="primary" style={{ marginTop: "1em" }}
                        onClick={handleClickLogin}>Login</Button>
                </form>
                <PopupDialog
                    open={dialogLoggedInOpenState}
                    setPopupDialogOpenState={setDialogLoggedInOpenState}
                    text="You have already logged in."
                    onClose={handleNavigateBackward} />
                <PopupDialog
                    open={dialogLoginFailureOpenState}
                    setPopupDialogOpenState={setDialogLoginFailureOpenState}
                    text="Login failed. Maybe you used a wrong password or username?" />
                <PopupDialog
                    open={dialogLoginSuccessOpenState}
                    setPopupDialogOpenState={setDialogLoginSuccessOpenState}
                    text="Login successfully."
                    onClose={handleNavigateBackward} />
                <LoginChecker
                    setDialogLoginFailureOpenState={setDialogLoginFailureOpenState}
                    setDialogLoginSuccessOpenState={setDialogLoginSuccessOpenState}
                    requestKey={requestKey}
                    loginUsernameFromInput={loginUsernameFromInput}
                    lastJsonMessage={lastJsonMessage} />
            </div>
        </>
    );
}