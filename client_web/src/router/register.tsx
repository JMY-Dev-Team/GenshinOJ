import {
    makeStyles,
    Input,
    Field,
    Button,
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
        maxWidth: "250px",
    },
});

function RegisterChecker({ websocketMessageHistory, setDialogRegisterSuccessOpenState, setDialogRegisterFailureOpenState }) {
    useEffect(() => {
        websocketMessageHistory.map((message, index) => {
            if (message) {
                if (message.type == "quit" && message.content.reason == "registration_success") {
                    setDialogRegisterSuccessOpenState(true);
                    globals.setData("isLoggedIn", false);
                    delete websocketMessageHistory[index];
                }

                if (message.type == "quit" && message.content.reason == "registration_failure") {
                    setDialogRegisterFailureOpenState(true);
                    globals.setData("isLoggedIn", false);
                    delete websocketMessageHistory[index];
                }
            }
        });
    }, [websocketMessageHistory]);

    return <div></div>;
}

export default function Register() {
    const {sendJsonMessage, lastJsonMessage, websocketMessageHistory, setWebsocketMessageHistory} = useOutletContext();
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
    const [dialogLoggedInOpenState, setDialogLoggedInOpenState] = useState(false);
    const [dialogPasswordInputAndConfirmNotTheSameOpenState, setDialogPasswordInputAndConfirmNotTheSameOpenState] = useState(false);
    const [dialogRegisterFailureOpenState, setDialogRegisterFailureOpenState] = useState(false);
    const [dialogRegisterSuccessOpenState, setDialogRegisterSuccessOpenState] = useState(false);
    const navigate = useNavigate();

    const handleClickRegisterSession = useCallback(() => {
        const request_key = globals.randomUUID();
        sendJsonMessage({
            type: "register",
            content: {
                username: registerUsername,
                password: registerPassword,
                request_key: request_key
            }
        })
    }, [registerUsername, registerPassword, sendJsonMessage]);

    useEffect(() => { if (globals.fetchData("isLoggedIn")) setDialogLoggedInOpenState(true); }, []);

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage));
    }, [lastJsonMessage]);
    return (
        <>
            <div className={useStyles().root}>
                <form>
                    <Field label="Register Username" required>
                        <Input contentBefore={<PersonRegular />}
                            onChange={(props) => setRegisterUsername(props.target.value)} />
                    </Field>
                    <Field label="Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setRegisterPassword(props.target.value)} />
                    </Field>
                    <Field label="Confirm Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onChange={(props) => setRegisterPasswordConfirm(props.target.value)} />
                    </Field>
                    <br />
                    <Button appearance="primary" onClick={() => {
                        if (registerPassword != registerPasswordConfirm)
                            setDialogPasswordInputAndConfirmNotTheSameOpenState(true);
                        else
                            handleClickRegisterSession();
                    }}>Register</Button>
                </form>
                <PopupDialog open={dialogLoggedInOpenState && !dialogRegisterSuccessOpenState} setPopupDialogOpenState={setDialogLoggedInOpenState} text="You have already logged in." onClose={() => navigate("/home")} />
                <PopupDialog open={dialogPasswordInputAndConfirmNotTheSameOpenState} setPopupDialogOpenState={setDialogPasswordInputAndConfirmNotTheSameOpenState} text="You input the password which is not the same as confirmed." onClose={undefined} />
                <PopupDialog open={dialogRegisterFailureOpenState} setPopupDialogOpenState={setDialogRegisterFailureOpenState} text="Registration failed. Maybe you registered an existed username or something went wrong." onClose={undefined} />
                <PopupDialog open={dialogRegisterSuccessOpenState} setPopupDialogOpenState={setDialogRegisterSuccessOpenState} text="Registration succeeded." onClose={() => navigate("/login")} />
                <RegisterChecker websocketMessageHistory={websocketMessageHistory} setDialogRegisterFailureOpenState={setDialogRegisterFailureOpenState} setDialogRegisterSuccessOpenState={setDialogRegisterSuccessOpenState} />
            </div>
        </>
    );
}