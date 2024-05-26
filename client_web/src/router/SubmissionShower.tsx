import { useState, useEffect, useCallback } from "react";
import { Link, useLoaderData, useNavigate, useOutletContext } from "react-router-dom";
import * as globals from "./Globals"
import PopupDialog from "./PopupDialog";
import { CheckmarkCircleRegular, ClipboardCheckmarkRegular, ErrorCircleRegular, ReOrderDotsHorizontalRegular, StatusRegular } from "@fluentui/react-icons";
import { Label, Spinner, Table, TableBody, TableHeader, TableHeaderCell, TableCell, TableRow } from "@fluentui/react-components";

interface SubmissionInfoFromLoader {
    submissionId: string;
}

interface SubmissionResult {
    submission_id: number;
    result: string;
    general_score: number;
    statuses: string[];
    scores: number[];
    problem_number: number;
}

function SubmissionStatusFetcher({ submissionId, lastJsonMessage, setSubmissionResult, setDialogSubmissionNotFoundOpenState }: {
    submissionId: string;
    lastJsonMessage: unknown;
    setSubmissionResult: React.Dispatch<React.SetStateAction<SubmissionResult | undefined>>;
    setDialogSubmissionNotFoundOpenState: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, _index) => {
            interface SubmissionResultFromFetch {
                type: string;
                content: {
                    submission_id: number;
                    result: string;
                    general_score: number;
                    statuses: string[];
                    scores: number[];
                    problem_number: number;
                };
            }

            function isSubmissionResultFromFetch(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'submission_id' in (x.content as object) &&
                        'result' in (x.content as object) &&
                        'general_score' in (x.content as object) &&
                        'statuses' in (x.content as object) &&
                        'scores' in (x.content as object) &&
                        'problem_number' in (x.content as object);
                }

                return false;
            }

            interface SubmissionResultOthers {
                type: string;
                content: {
                    submission_id: number;
                    result: string;
                };
            }

            function isSubmissionResultOthers(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'submission_id' in (x.content as object) &&
                        'result' in (x.content as object);
                }

                return false;
            }

            if (_message) {
                if (isSubmissionResultFromFetch(_message)) {
                    const message = _message as SubmissionResultFromFetch;
                    console.log(message);
                    if (message.content.submission_id.toString() == submissionId) {
                        setSubmissionResult(message.content as SubmissionResult);
                        delete _websocketMessageHistory[_index];
                    }
                }
                else if (isSubmissionResultOthers(_message)) {
                    const message = _message as SubmissionResultOthers;
                    console.log(message);
                    if (message.content.submission_id.toString() == submissionId) {
                        setSubmissionResult(message.content as SubmissionResult);
                        if (message.content.result === "SNF") setDialogSubmissionNotFoundOpenState(true);
                        delete _websocketMessageHistory[_index];
                    }
                }
            }
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, submissionId, setSubmissionResult, setDialogSubmissionNotFoundOpenState]);

    return <></>;
}

export default function SubmissionShower() {
    const { submissionId } = (useLoaderData() as SubmissionInfoFromLoader);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult>();
    const [, setWebsocketMessageHistory] = useState([]);
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    const [dialogSubmissionNotFoundOpenState, setDialogSubmissionNotFoundOpenState] = useState(false);
    const navigate = useNavigate();

    const handleSubmissionResultFetch = useCallback(() => {
        sendJsonMessage({
            type: "submission_result",
            content: {
                submission_id: Number(submissionId)
            }
        });
    }, [sendJsonMessage, submissionId])

    useEffect(() => {
        if (!globals.fetchData("isLoggedIn"))
            setDialogRequireLoginOpenState(true);
        else
            handleSubmissionResultFetch();
    }, [handleSubmissionResultFetch]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    return <div style={{ padding: "4px 0" }}>
        {
            globals.fetchData("isLoggedIn") && submissionResult
                ?
                <>
                    <div style={{ display: "flex" }}>
                        <Label style={{ margin: "auto 4px auto 20px" }}>Submission ID: {submissionResult.submission_id}</Label>
                        <Label style={{ margin: "auto 4px auto 20px" }}>Submission Problem: <Link style={{ color: "#4183C4" }} to={`/problem/${submissionResult.problem_number}`}>{submissionResult.problem_number}</Link></Label>
                        <Label style={{ margin: "auto 4px auto 20px" }}>Status: </Label>
                        {
                            (
                                submissionResult.result === "PD"
                                    ?
                                    <Spinner size="tiny" label="Pending..." />
                                    :
                                    (
                                        submissionResult.result === "AC"
                                            ?
                                            <><CheckmarkCircleRegular fontSize="20px" style={{ color: "#3AAF00" }} /><Label>&nbsp;Accepted</Label></>
                                            :
                                            (
                                                submissionResult.result === "CE"
                                                    ?
                                                    <><ErrorCircleRegular fontSize="20px" style={{ color: "#FDDB10" }} /><Label>&nbsp;Compile Error</Label></>
                                                    :
                                                    (
                                                        submissionResult.result === "WA"
                                                            ?
                                                            <><ErrorCircleRegular fontSize="20px" style={{ color: "#DA3737" }} /><Label>&nbsp;Unaccepted</Label></>
                                                            :
                                                            <></>
                                                    )

                                            )

                                    )
                            )
                        }
                        {
                            submissionResult.result !== "PD" && submissionResult.result !== "SNF"
                                ?
                                <Label style={{ margin: "auto 4px auto 20px" }}>Score: <Label style={{ color: (submissionResult.general_score >= 80) ? "#3AAF00" : ((submissionResult.general_score >= 60) ? "#FDDB10" : "#DA3737") }}>{submissionResult.general_score}</Label></Label>
                                :
                                <></>
                        }
                    </div>
                    <br />
                    <div style={{ margin: "auto 12px" }}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell><ReOrderDotsHorizontalRegular fontSize="18px" /><Label>Test Case ID</Label></TableHeaderCell>
                                    <TableHeaderCell><StatusRegular fontSize="18px" /><Label>Status</Label></TableHeaderCell>
                                    <TableHeaderCell><ClipboardCheckmarkRegular fontSize="18px" /><Label>Score</Label></TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {
                                    submissionResult.statuses
                                        ?
                                        submissionResult.statuses.map((status, index) => {
                                            return <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{status}</TableCell>
                                                <TableCell>{submissionResult.scores[index]}</TableCell>
                                            </TableRow>;
                                        })
                                        :
                                        <></>
                                }
                            </TableBody>
                        </Table>
                    </div>
                </>
                :
                <></>
        }
        <PopupDialog
            open={dialogSubmissionNotFoundOpenState}
            setPopupDialogOpenState={setDialogSubmissionNotFoundOpenState}
            text={`Submission ${submissionId} is not found!`}
            onClose={() => navigate("/")} />
        <PopupDialog
            open={dialogRequireLoginOpenState}
            setPopupDialogOpenState={setDialogRequireLoginOpenState}
            text="Please login first."
            onClose={() => navigate("/login")} />
        <SubmissionStatusFetcher
            submissionId={submissionId}
            lastJsonMessage={lastJsonMessage}
            setSubmissionResult={setSubmissionResult}
            setDialogSubmissionNotFoundOpenState={setDialogSubmissionNotFoundOpenState}
        />
    </div>;
}