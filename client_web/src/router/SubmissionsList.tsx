import { useEffect, useState, useCallback, lazy } from "react";
import {
    makeStyles,
    Button,
    Label,
    Field,
    Input,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableCell,
    TableBody,
    Spinner,
} from "@fluentui/react-components";
import { useNavigate, useOutletContext } from "react-router-dom";

import { useSelector } from "react-redux";

import { nanoid } from "nanoid";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "../Globals.ts";
import { RootState } from "../store.ts";

function getColorByResult(result: string) {
    if (result === "AC") return "#3AAF00";
    else if (result === "CE") return "#FDDB10";
    else if (result === "WA") return "#DA3737";
    else if (result === "UKE") return "#1F103F";
    else return "#4183C4";
}

function getColorByScore(score: number) {
    if (score >= 80) return "#3AAF00";
    else if (score >= 60) return "#FDDB10";
    else return "#DA3737";
}

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px",
        columnGap: "4px",
        maxWidth: "450px",
        padding: "4px 0 0 0",
    },
});

interface SubmissionResult {
    submission_id: number;
    result: string;
    general_score: number;
    statuses: string[];
    scores: number[];
    problem_number: number;
}

interface SubmissionResultOthers {
    submission_id: number;
    result: string;
    problem_number: number;
}

interface SubmissionsListFromFetch {
    type: string;
    content: {
        submissions_list: SubmissionResult[] | SubmissionResultOthers[];
        request_key: string;
    };
}

function isSubmissionsListFromFetch(x: object) {
    if ('type' in x && 'content' in x && typeof x.content === 'object') {
        return 'submissions_list' in (x.content as object) &&
            'request_key' in (x.content as object);
    }

    return false;
}

function SubmissionsListFetcher({ lastJsonMessage, setSubmissionsList, requestKey }: {
    lastJsonMessage: unknown;
    setSubmissionsList: React.Dispatch<React.SetStateAction<SubmissionResult[] | SubmissionResultOthers[] | undefined>>;
    requestKey: string;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, _index) => {
            if (_message) {
                if (isSubmissionsListFromFetch(_message)) {
                    const message = _message as SubmissionsListFromFetch;
                    if (message.content.request_key == requestKey) {
                        console.log(message);
                        setSubmissionsList(message.content.submissions_list);
                        delete _websocketMessageHistory[_index];
                    }
                }
            }
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, setSubmissionsList, requestKey]);

    return <></>;
}

interface TotalSubmissionsListIndexFromFetch {
    type: string;
    content: {
        total_submissions_list_index: number;
        request_key: string;
    };
}

function isTotalSubmissionsListIndexFromFetch(x: object) {
    if ('type' in x && 'content' in x && typeof x.content === 'object') {
        return 'total_submissions_list_index' in (x.content as object) &&
            'request_key' in (x.content as object);
    }

    return false;
}

function TotalSubmissionsListIndexFetcher({ lastJsonMessage, setTotalSubmissionsListIndex, requestKey }: {
    lastJsonMessage: unknown;
    setTotalSubmissionsListIndex: React.Dispatch<number>;
    requestKey: string;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, _index) => {
            if (_message) {
                if (isTotalSubmissionsListIndexFromFetch(_message)) {
                    const message = _message as TotalSubmissionsListIndexFromFetch;
                    if (message.content.request_key == requestKey) {
                        console.log(message);
                        setTotalSubmissionsListIndex(message.content.total_submissions_list_index);
                        delete _websocketMessageHistory[_index];
                    }
                }
            }
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, setTotalSubmissionsListIndex, requestKey]);

    return <></>;
}

export default function SubmissionsList() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [requestKeyOfSubmissionsListFetcher, setRequestKeyOfSubmissionsListFetcher] = useState("");
    const [requestKeyOfTotalSubmissionsListIndexFetcher, setRequestKeyOfTotalSubmissionsListIndexFetcher] = useState("");
    const [submissionId, setSubmissionId] = useState("-1");
    const [submissionsListIndex, setSubmissionsListIndex] = useState(1);
    const [submissionsList, setSubmissionsList] = useState<SubmissionResult[] | SubmissionResultOthers[] | undefined>(undefined);
    const [totalSubmissionsListIndex, setTotalSubmissionsListIndex] = useState(1);
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const navigate = useNavigate();

    const handleFetchSubmissionsList = useCallback((_submissionsListIndex: number) => {
        const _requestKey = nanoid();
        sendJsonMessage({
            type: "submissions_list",
            content: {
                index: _submissionsListIndex,
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [sendJsonMessage]);

    const handleFetchTotalSubmissionsListIndex = useCallback(() => {
        const _requestKey = nanoid();
        sendJsonMessage({
            type: "total_submissions_list_index",
            content: {
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [sendJsonMessage]);

    useEffect(() => {
        if (loginStatus.value === false)
            setDialogRequireLoginOpenState(true);
        else
            setRequestKeyOfSubmissionsListFetcher(handleFetchSubmissionsList(submissionsListIndex));

    }, [setRequestKeyOfSubmissionsListFetcher, handleFetchSubmissionsList, submissionsListIndex, loginStatus]);

    useEffect(() => {
        if (loginStatus.value === false)
            setDialogRequireLoginOpenState(true);
        else
            setRequestKeyOfTotalSubmissionsListIndexFetcher(handleFetchTotalSubmissionsListIndex());
    }, [setRequestKeyOfTotalSubmissionsListIndexFetcher, handleFetchTotalSubmissionsListIndex, loginStatus]);

    const handleNavigateLogin = useCallback(() => {
        navigate("/login");
    }, [navigate]);

    return <>
        <div className={useStyles().root}>
            <form style={{ margin: "0 0 0 12px" }}>
                <Field label="Submission ID">
                    <div style={{ display: "flex", columnGap: "4px" }}>
                        <Input onChange={(props) => setSubmissionId(props.target.value)} style={{ flex: "75%" }} />
                        <Button appearance="primary"
                            style={{ flex: "25%" }}
                            onClick={() => { navigate("/submission/" + String(submissionId)); }}>Jump to</Button>
                    </div>
                </Field>
                <div style={{ marginTop: "1em" }}>
                    <div style={{ margin: "0 0 4px 0" }}>
                        <Label>Submission Index Page of {submissionsListIndex} / {Math.max(totalSubmissionsListIndex, 1)}</Label>
                    </div>
                    <div style={{ display: "flex", columnGap: "4px" }}>
                        <Button appearance="primary"
                            style={{ flex: "25%" }}
                            onClick={() => { setSubmissionsListIndex((c) => (Math.max(1, c - 1))); }}>Previous</Button>
                        <Button appearance="primary"
                            style={{ flex: "25%" }}
                            onClick={() => { setSubmissionsListIndex((c) => (Math.max(1, Math.min(totalSubmissionsListIndex, c + 1)))); }}>Next</Button>
                        <Button appearance="secondary"
                            style={{ flex: "25%" }}
                            onClick={() => { setSubmissionsListIndex((c) => (Math.max(1, c - 10))); }}>Backward 10</Button>
                        <Button appearance="secondary"
                            style={{ flex: "25%" }}
                            onClick={() => { setSubmissionsListIndex((c) => (Math.max(1, Math.min(1, totalSubmissionsListIndex, c + 10)))); }}>Forward 10</Button>
                    </div>
                </div>
            </form>
        </div>
        <div style={{ padding: "4px 4px 0 4px", maxWidth: "700px", marginTop: "1em" }}>
            {
                submissionsList === undefined ?
                    <div style={{ padding: "4px 4px 0 4px", maxWidth: "450px" }}><Spinner size="tiny" label="Waiting..." delay={500} /></div>
                    :
                    <>
                        <Table size="medium">
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>Submission ID</TableHeaderCell>
                                    <TableHeaderCell>Problem Number</TableHeaderCell>
                                    <TableHeaderCell>Status</TableHeaderCell>
                                    <TableHeaderCell>Score</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    submissionsList.map((submissionResult: SubmissionResult | SubmissionResultOthers, key) => (
                                        <TableRow key={key}>
                                            <TableCell style={{ color: "#4183C4" }}
                                                onMouseEnter={(e) => { (e.target as HTMLTableCellElement).style.color = "#0056B3"; (e.target as HTMLTableCellElement).style.cursor = "pointer"; }}
                                                onMouseLeave={(e) => { (e.target as HTMLTableCellElement).style.color = "#4183C4"; (e.target as HTMLTableCellElement).style.cursor = "default"; }}
                                                onClick={() => { navigate("/submission/" + String(submissionResult.submission_id)); }}>
                                                {submissionResult.submission_id}
                                            </TableCell>
                                            <TableCell style={{ color: "#4183C4" }}
                                                onMouseEnter={(e) => { (e.target as HTMLTableCellElement).style.color = "#0056B3"; (e.target as HTMLTableCellElement).style.cursor = "pointer"; }}
                                                onMouseLeave={(e) => { (e.target as HTMLTableCellElement).style.color = "#4183C4"; (e.target as HTMLTableCellElement).style.cursor = "default"; }}
                                                onClick={() => { navigate("/problem/" + String(submissionResult.problem_number)); }}>
                                                {submissionResult.problem_number}
                                            </TableCell>
                                            <TableCell style={{ color: getColorByResult('result' in submissionResult ? submissionResult.result : "PD") }}>{'result' in submissionResult ? submissionResult.result : "PD"}</TableCell>
                                            <TableCell style={{ color: "general_score" in submissionResult ? getColorByScore(submissionResult.general_score) : undefined }}>{"general_score" in submissionResult ? submissionResult.general_score : "-"}</TableCell>
                                        </TableRow>
                                    )
                                    )
                                }
                            </TableBody>
                        </Table>
                    </>
            }
            <PopupDialog
                open={dialogRequireLoginOpenState}
                setPopupDialogOpenState={setDialogRequireLoginOpenState}
                text="Please login first."
                onClose={handleNavigateLogin} />
            <SubmissionsListFetcher
                setSubmissionsList={setSubmissionsList}
                requestKey={requestKeyOfSubmissionsListFetcher}
                lastJsonMessage={lastJsonMessage} />
            <TotalSubmissionsListIndexFetcher
                setTotalSubmissionsListIndex={setTotalSubmissionsListIndex}
                requestKey={requestKeyOfTotalSubmissionsListIndexFetcher}
                lastJsonMessage={lastJsonMessage} />
        </div>
    </>;
}
