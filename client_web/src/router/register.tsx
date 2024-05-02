import {
    makeStyles,
    shorthands,
    Input,
    Field,
    Button
} from "@fluentui/react-components";

import {
    PersonRegular,
    PasswordRegular
} from "@fluentui/react-icons";

import { useRef, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useEffect } from "react";

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
    const navigate = useNavigate();
    return (
        <>
            <div className={useStyles().root}>
                <form>
                    <Field label="Register Username" required>
                        <Input contentBefore={<PersonRegular />} 
                        onInput={(props) => { setRegisterUsername(props.currentTarget.value); }}/>
                    </Field>
                    <Field label="Register Password" required>
                        <Input contentBefore={<PasswordRegular />} type="password" 
                        onInput={(props) => { setRegisterPassword(props.currentTarget.value); }}/>
                    </Field>
                    <Button appearance="primary" onClick={() => {
                        globals.registerSession(registerUsername, registerPassword).then((result) => {
                            if (result) {
                                navigate("/login");
                            }
                        }).catch((error) => {
                            console.error("Error signing up:", error);
                        });
                    }}>Register</Button>
                </form>
            </div>
        </>
    );
}