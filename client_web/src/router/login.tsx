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

import { useNavigate } from "react-router-dom";

import "../css/style.css";

import * as globals from "./Globals";
import useWebSocket from "react-use-websocket";
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

function LoginChecker({ messageHistory, setDialogLoginSuccessOpenState, setDialogLoginFailureOpenState }) {
    useEffect(() => {
        messageHistory.map((message, index) => {
            if (message) {
                console.log(message);
                if (message.type == "session_token") {
                    setDialogLoginSuccessOpenState(true);
                    globals.setData("isLoggedIn", true);
                    globals.setData("sessionToken", message.content.session_token);
                    delete messageHistory[index];
                }

                if (message.type == "quit") {
                    setDialogLoginFailureOpenState(true);
                    globals.setData("isLoggedIn", false);
                    delete messageHistory[index];
                }
            }
        })
    });

    return <div style={{ display: "none" }}>
        <ul>
            {messageHistory.map((message, idx) => (
                <li key={idx}>{message ? JSON.stringify(message) : null}</li>
            ))}
        </ul>
    </div>;
}

export default function Login() {
    const [messageHistory, setMessageHistory] = useState([]);
    const {
        sendJsonMessage,
        lastJsonMessage,
    } = useWebSocket("ws://" + location.host + "/wsapi", { share: true });
    const [loginUsername, setLoginUsername] = useState("");
    const [loginPassword, setLoginPassword] = useState("");
    const [dialogLoggedInOpenState, setDialogLoggedInOpenState] = useState(false);
    const [dialogLoginFailureOpenState, setDialogLoginFailureOpenState] = useState(false);
    const [dialogLoginSuccessOpenState, setDialogLoginSuccessOpenState] = useState(false);
    const navigate = useNavigate();

    const handleClickLoginSession = useCallback(() => {
        const request_key = globals.randomUUID();
        sendJsonMessage({
            type: "login",
            content: {
                username: loginUsername,
                password: loginPassword,
                request_key: request_key
            }
        })
    }, [loginUsername, loginPassword, sendJsonMessage]);

    useEffect(() => { if (globals.fetchData("isLoggedIn")) setDialogLoggedInOpenState(true); }, []);

    useEffect(() => {
        if (lastJsonMessage !== null)
            setMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage));
    }, [lastJsonMessage]);

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
                    <Button appearance="primary" onClick={handleClickLoginSession}>Login</Button>
                </form>
                <PopupDialog open={dialogLoggedInOpenState} setPopupDialogOpenState={setDialogLoggedInOpenState} text="You have already logged in." onClose={() => navigate(-1)} />
                <PopupDialog open={dialogLoginFailureOpenState} setPopupDialogOpenState={setDialogLoginFailureOpenState} text="Login failed. Maybe you used a wrong password or username?" onClose={undefined} />
                <PopupDialog open={dialogLoginSuccessOpenState} setPopupDialogOpenState={setDialogLoginSuccessOpenState} text="Login successfully." onClose={() => navigate(-1)} />
                <LoginChecker messageHistory={messageHistory} setDialogLoginFailureOpenState={setDialogLoginFailureOpenState} setDialogLoginSuccessOpenState={setDialogLoginSuccessOpenState} />
            </div>
        </>
    );
}