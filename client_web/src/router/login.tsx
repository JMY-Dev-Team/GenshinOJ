import {
    makeStyles,
    Input,
    Field,
    Button
} from "@fluentui/react-components";

import {
    PersonRegular,
    PasswordRegular
} from "@fluentui/react-icons";

import { useCallback, useEffect, useState } from "react";

import { useNavigate, useOutletContext } from "react-router-dom";

import "../css/style.css";

import * as globals from "./Globals";
import PopupDialog from "./PopupDialog";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px",
        columnGap: "4px",
        maxWidth: "300px",
    },
});

function LoginChecker({ websocketMessageHistory, setDialogLoginSuccessOpenState, setDialogLoginFailureOpenState, requestKey, loginUsername }) {
    useEffect(() => {
        websocketMessageHistory.map((message, index) => {
            if (message) {
                if (message.content.request_key === requestKey) {
                    if (message.type === "quit") {
                        setDialogLoginFailureOpenState(true);
                        globals.setData("isLoggedIn", false);
                    }
                    if (message.type === "session_token") {
                        setDialogLoginSuccessOpenState(true);
                        globals.setData("isLoggedIn", true);
                        globals.setData("sessionToken", message.content.session_token);
                        globals.setData("loginUsername", loginUsername);
                    }

                    delete websocketMessageHistory[index];
                }
            }
        });
    }, [websocketMessageHistory, requestKey, loginUsername, setDialogLoginSuccessOpenState, setDialogLoginFailureOpenState]);

    return <div></div>;
}

export default function Login() {
    const [requestKey, setRequestKey] = useState("");
    const { sendJsonMessage, lastJsonMessage, websocketMessageHistory, setWebsocketMessageHistory } = useOutletContext();
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [dialogLoggedInOpenState, setDialogLoggedInOpenState] = useState(false);
    const [dialogLoginFailureOpenState, setDialogLoginFailureOpenState] = useState(false);
    const [dialogLoginSuccessOpenState, setDialogLoginSuccessOpenState] = useState(false);
    const navigate = useNavigate();

    const handleClickLoginSession = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "login",
            content: {
                username: loginUsername,
                password: loginPassword,
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [loginUsername, loginPassword, sendJsonMessage]);

    useEffect(() => { if (globals.fetchData("isLoggedIn")) setDialogLoggedInOpenState(true); }, []);

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage));
    }, [lastJsonMessage, setWebsocketMessageHistory]);

    return (
        <>
            <div className={useStyles().root}>
                <form>
                    <Field label="Login Username" required>
                        <Input contentBefore={<PersonRegular />}
                            onChange={(props) => setLoginUsername(props.target.value)} />
                    </Field>
                    <Field label="Login Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setLoginPassword(props.target.value)} />
                    </Field>
                    <br />
                    <Button appearance="primary" onClick={() => { setRequestKey(handleClickLoginSession()); }}>Login</Button>
                </form>
                <PopupDialog open={dialogLoggedInOpenState} setPopupDialogOpenState={setDialogLoggedInOpenState} text="You have already logged in." onClose={() => navigate(-1)} />
                <PopupDialog open={dialogLoginFailureOpenState} setPopupDialogOpenState={setDialogLoginFailureOpenState} text="Login failed. Maybe you used a wrong password or username?" onClose={undefined} />
                <PopupDialog open={dialogLoginSuccessOpenState} setPopupDialogOpenState={setDialogLoginSuccessOpenState} text="Login successfully." onClose={() => navigate(-1)} />
                <LoginChecker websocketMessageHistory={websocketMessageHistory} setDialogLoginFailureOpenState={setDialogLoginFailureOpenState} setDialogLoginSuccessOpenState={setDialogLoginSuccessOpenState} requestKey={requestKey} loginUsername={loginUsername} />
            </div>
        </>
    );
}