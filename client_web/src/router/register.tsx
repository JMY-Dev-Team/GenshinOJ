import {
    makeStyles,
    shorthands,
    Input,
    Field,
    Button,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogContent,
    DialogActions,
    DialogTrigger
} from "@fluentui/react-components";

import {
    PersonRegular,
    PasswordRegular
} from "@fluentui/react-icons";

import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import "../css/style.css";

import * as globals from "./globals";
import React from "react";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap("4px"),
        maxWidth: "250px",
    },
});

export default function Register() {
    const [registerUsername, setRegisterUsername] = useState("");
    const [registerPassword, setRegisterPassword] = useState("");
    const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
    const [dialogLoggedInOpenState, setDialogLoggedInOpenState] = useState(false);
    const [dialogPasswordInputAndConfirmNotTheSameOpenState, setDialogPasswordInputAndConfirmNotTheSameOpenState] = useState(false);
    const [dialogRegistrationFailureOpenState, setDialogRegistrationFailureOpenState] = useState(false);
    const [dialogRegistrationSuccessOpenState, setDialogRegistrationSuccessOpenState] = useState(false);
    const navigate = useNavigate();
    useEffect(() => { if (globals.getIsLoggedIn()) setDialogLoggedInOpenState(true); }, [])
    return (
        <>
            <div className={useStyles().root}>
                <form>
                    <Field label="Register Username" required>
                        <Input contentBefore={<PersonRegular />}
                            onInput={(props) => { setRegisterUsername(props.currentTarget.value); }} />
                    </Field>
                    <Field label="Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onInput={(props) => { setRegisterPassword(props.currentTarget.value); }} />
                    </Field>
                    <Field label="Confirm Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password"
                            onInput={(props) => { setRegisterPasswordConfirm(props.currentTarget.value); }} />
                    </Field>
                    <Button appearance="primary" onClick={() => {
                        if(registerPassword != registerPasswordConfirm)
                            setDialogPasswordInputAndConfirmNotTheSameOpenState(true);
                        else
                        {
                            globals.registerSession(registerUsername, registerPassword).then((result) => {
                                if (result) { setDialogRegistrationSuccessOpenState(true); }
                                else setDialogRegistrationFailureOpenState(true);
                            }).catch((error) => {
                                console.error("Error signing up:", error);
                            });
                        }
                    }}>Register</Button>
                </form>
                <Dialog modalType="alert" open={dialogLoggedInOpenState} onOpenChange={(event, data) => {
                    setDialogLoggedInOpenState(data.open);
                }}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogContent>
                                You have already logged in.
                            </DialogContent>
                            <DialogActions>
                                <DialogTrigger disableButtonEnhancement>
                                    <Button appearance="primary" onClick={
                                        () => {
                                            setDialogLoggedInOpenState(false);
                                            navigate("/home");
                                        }
                                    }>Close</Button>
                                </DialogTrigger>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
                <Dialog modalType="alert" open={dialogPasswordInputAndConfirmNotTheSameOpenState} onOpenChange={(event, data) => {
                    setDialogPasswordInputAndConfirmNotTheSameOpenState(data.open);
                }}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogContent>
                                You input the password which is not the same as confirmed.
                            </DialogContent>
                            <DialogActions>
                                <DialogTrigger disableButtonEnhancement>
                                    <Button appearance="primary" onClick={
                                        () => {
                                            setDialogPasswordInputAndConfirmNotTheSameOpenState(false);
                                        }
                                    }>Close</Button>
                                </DialogTrigger>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
                <Dialog modalType="alert" open={dialogRegistrationFailureOpenState} onOpenChange={(event, data) => {
                    setDialogRegistrationFailureOpenState(data.open);
                }}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogContent>
                                Registration failed. Maybe you registered an existed username or something went wrong.
                            </DialogContent>
                            <DialogActions>
                                <DialogTrigger disableButtonEnhancement>
                                    <Button appearance="primary" onClick={
                                        () => {
                                            setDialogRegistrationFailureOpenState(false);
                                        }
                                    }>Close</Button>
                                </DialogTrigger>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
                <Dialog modalType="alert" open={dialogRegistrationSuccessOpenState} onOpenChange={(event, data) => {
                    setDialogRegistrationSuccessOpenState(data.open);
                }}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogContent>
                                Registration succeeded.
                            </DialogContent>
                            <DialogActions>
                                <DialogTrigger disableButtonEnhancement>
                                    <Button appearance="primary" onClick={
                                        () => {
                                            navigate("/login");
                                            setDialogRegistrationSuccessOpenState(false);
                                        }
                                    }>Close</Button>
                                </DialogTrigger>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            </div>
        </>
    );
}