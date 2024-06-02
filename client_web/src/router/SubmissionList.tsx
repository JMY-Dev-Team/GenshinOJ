import { Button, Field, Input, makeStyles } from "@fluentui/react-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px",
        columnGap: "4px",
        maxWidth: "300px",
        padding: "4px 0",
    },
});

export default function SubmissionList() {
    const navigate = useNavigate();
    const [submissionId, setSubmissionId] = useState("-1");
    return <div className={useStyles().root}>
        <form>
            <Field label="Submission ID">
                <Input onChange={(props) => setSubmissionId(props.target.value)}/>
            </Field>
            <br />
            <Button appearance="primary"
                onClick={() => { navigate("/submission/" + submissionId) }}>Jump to</Button>
        </form>
    </div>;
}