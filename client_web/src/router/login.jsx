import {
    makeStyles,
    shorthands,
    Input,
    Field,
    Label,
    Button
} from "@fluentui/react-components";

import { 
    PersonRegular,
    PasswordRegular
} from "@fluentui/react-icons";

import "../css/style.css";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap("4px"),
        maxWidth: "250px",
    },
});

export default function Login() {
    const styles = useStyles();
    return (
        <div className={styles.root}>
            <Field label="Login Username" required>
                <Input id="loginUsername" contentBefore={<PersonRegular/>}></Input>
            </Field>
            <Field label="Login Password" required>
                <Input id="loginPassword" contentBefore={<PasswordRegular/>}></Input>
            </Field>
            <Button>Login</Button>
        </div>
    );
}