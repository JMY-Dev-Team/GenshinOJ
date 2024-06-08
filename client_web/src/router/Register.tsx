import { useEffect, useState, lazy, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import { makeStyles, Input, Field, Button } from "@fluentui/react-components";
import { PersonRegular, PasswordRegular } from "@fluentui/react-icons";

import { useDispatch, useSelector } from "react-redux";

import { nanoid } from "nanoid";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "../Globals.ts";
import { RootState } from "../store.ts";
import { logoutReducer } from "../../redux/loginStatusSlice.ts";

import "../css/style.css";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px",
        columnGap: "4px",
        maxWidth: "300px",
        padding: "4px 0 0 12px ",
    },
});

function RegisterChecker({ setDialogRegisterSuccessOpenState, setDialogRegisterFailureOpenState, requestKey, lastJsonMessage }: {
    setDialogRegisterSuccessOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    setDialogRegisterFailureOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    requestKey: string;
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
        websocketMessageHistory.map((_message, index) => {
            interface RegisterSessionResult {
                type: string;
                content: {
                    reason: string,
                    request_key: string
                };
            }

            function isRegisterSession(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'request_key' in (x.content as object) && 'reason' in (x.content as object) && x.type === 'quit';
                }

                return false;
            }
            if (_message && isRegisterSession(_message)) {
                const message = _message as RegisterSessionResult;
                if (message.content.reason == "registration_success") {
                    setDialogRegisterSuccessOpenState(true);
                    dispatch(logoutReducer());
                    delete _websocketMessageHistory[index];
                }

                if (message.type == "quit" && message.content.reason == "registration_failure") {
                    setDialogRegisterFailureOpenState(true);
                    dispatch(logoutReducer());
                    delete _websocketMessageHistory[index];
                }
            }
        });
    }, [websocketMessageHistory, requestKey, setDialogRegisterFailureOpenState, setDialogRegisterSuccessOpenState]);

    return <></>;
}

export default function Register() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [requestKey, setRequestKey] = useState("");
    const [registerUsernameFromInput, setRegisterUsernameFromInput] = useState("");
    const [registerPasswordFromInput, setRegisterPasswordFromInput] = useState("");
    const [registerPasswordConfirmFromInput, setRegisterPasswordConfirmFromInput] = useState("");
    const [dialogLoggedInOpenState, setDialogLoggedInOpenState] = useState(false);
    const [dialogPasswordInputAndConfirmNotTheSameOpenState, setDialogPasswordInputAndConfirmNotTheSameOpenState] = useState(false);
    const [dialogRegisterFailureOpenState, setDialogRegisterFailureOpenState] = useState(false);
    const [dialogRegisterSuccessOpenState, setDialogRegisterSuccessOpenState] = useState(false);
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const navigate = useNavigate();

    const handleClickRegisterSession = useCallback(() => {
        const request_key = nanoid();
        sendJsonMessage({
            type: "register",
            content: {
                username: registerUsernameFromInput,
                password: registerPasswordFromInput,
                request_key: request_key
            }
        });
        return request_key;
    }, [registerPasswordFromInput, registerUsernameFromInput, sendJsonMessage]);

    const handleRegistrationClick = useCallback(() => {
        if (registerPasswordFromInput != registerPasswordConfirmFromInput)
            setDialogPasswordInputAndConfirmNotTheSameOpenState(true);
        else
            setRequestKey(handleClickRegisterSession());
    }, [handleClickRegisterSession, registerPasswordFromInput, registerPasswordConfirmFromInput]);

    useEffect(() => { if (loginStatus.value === true) setDialogLoggedInOpenState(true); }, []);
    return (
        <>
            <div className={useStyles().root}>
                <form>
                    <Field label="Register Username" required>
                        <Input contentBefore={<PersonRegular />}
                            onChange={(props) => setRegisterUsernameFromInput(props.target.value)} />
                    </Field>
                    <Field label="Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setRegisterPasswordFromInput(props.target.value)} />
                    </Field>
                    <Field label="Confirm Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setRegisterPasswordConfirmFromInput(props.target.value)} />
                    </Field>
                    <Button appearance="primary" onClick={handleRegistrationClick} style={{ marginTop: "1em" }}>Register</Button>
                </form>
                <PopupDialog
                    open={dialogLoggedInOpenState && !dialogRegisterSuccessOpenState}
                    setPopupDialogOpenState={setDialogLoggedInOpenState}
                    text="You have already logged in."
                    onClose={() => navigate("/home")} />
                <PopupDialog
                    open={dialogPasswordInputAndConfirmNotTheSameOpenState}
                    setPopupDialogOpenState={setDialogPasswordInputAndConfirmNotTheSameOpenState}
                    text="You input the password which is not the same as confirmed." />
                <PopupDialog
                    open={dialogRegisterFailureOpenState}
                    setPopupDialogOpenState={setDialogRegisterFailureOpenState}
                    text="Registration failed. Maybe you registered an existed username or something went wrong." />
                <PopupDialog
                    open={dialogRegisterSuccessOpenState}
                    setPopupDialogOpenState={setDialogRegisterSuccessOpenState}
                    text="Registration succeeded."
                    onClose={() => navigate("/login")} />
                <RegisterChecker
                    setDialogRegisterFailureOpenState={setDialogRegisterFailureOpenState}
                    setDialogRegisterSuccessOpenState={setDialogRegisterSuccessOpenState}
                    requestKey={requestKey}
                    lastJsonMessage={lastJsonMessage} />
            </div>
        </>
    );
}