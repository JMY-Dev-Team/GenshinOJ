import { useState, useEffect, useCallback, BaseSyntheticEvent, lazy, ReactNode, Suspense } from "react";
import { useLoaderData, useNavigate, useOutletContext } from "react-router-dom";


import { ClipboardCheckmarkRegular, ClipboardCodeRegular, ClipboardTaskFilled, ReOrderDotsHorizontalRegular, StatusRegular } from "@fluentui/react-icons";
import { Label, Spinner, Table, TableBody, TableHeader, TableHeaderCell, TableCell, TableRow } from "@fluentui/react-components";

import { useSelector } from "react-redux";
const copy = (await import("copy-to-clipboard")).default;

const SyntaxHighlighter = lazy(() => import("react-syntax-highlighter"));

const BadgeButton = lazy(() => import("./BadgeButton.tsx"));
const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "../Globals.ts";

import { RootState } from "../store.ts";

import "../css/font.css";

interface SubmissionInfoFromLoader {
    submissionId: number;
}

interface SubmissionResult {
    submission_id: number;
    result: string;
    general_score?: number;
    statuses?: string[];
    scores?: number[];
    problem_number: number;
    code: string[];
    language: string;
    username: string;
}

function CopyToTheClipboardButton({ content }: {
    content: string;
}) {
    const [tipText, setTipText] = useState("Copy");
    const [tipIcon, setTipIcon] = useState<ReactNode>(<ClipboardCodeRegular fontSize="1.1em" style={{ margin: "0 4px 0 0" }} />);
    useEffect(() => {
        if (tipText === "Copied")
            setTimeout(() => {
                if (tipText === "Copied") setTipText("Copy"), setTipIcon(<ClipboardCodeRegular fontSize="1.1em" style={{ margin: "0 4px 0 0" }} />);
            }, 500);
    }, [tipText]);

    const handleOnClick = useCallback((_: BaseSyntheticEvent) => { copy(content); setTipText("Copied"); setTipIcon(<ClipboardTaskFilled fontSize="1.1em" style={{ margin: "0 4px 0 0" }} />) }, [content]);
    return <BadgeButton style={{ marginLeft: "auto", marginRight: "4px" }} onClick={handleOnClick}>{tipIcon}<span style={{ fontSize: "1.1em" }}>{tipText}</span></BadgeButton>
}

function SubmissionStatusFetcher({ submissionId, lastJsonMessage, setSubmissionResult, setDialogSubmissionNotFoundOpenState }: {
    submissionId: number;
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
                    code: string[];
                    language: string;
                    username: string;
                };
            }

            function isSubmissionResultFromFetch(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'submission_id' in (x.content as object) &&
                        'result' in (x.content as object) &&
                        'general_score' in (x.content as object) &&
                        'statuses' in (x.content as object) &&
                        'scores' in (x.content as object) &&
                        'problem_number' in (x.content as object) &&
                        'code' in (x.content as object);
                }

                return false;
            }

            interface SubmissionResultOthersFromFetch {
                type: string;
                content: {
                    submission_id: number;
                    result: string;
                    general_score?: number;
                    statuses?: string[];
                    scores?: number[];
                    problem_number?: number;
                    code?: string[];
                    language?: string;
                    username?: string;
                };
            }

            function isSubmissionResultOthersFromFetch(x: object) {
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
                    if (message.content.submission_id == submissionId) {
                        setSubmissionResult(message.content as SubmissionResult);
                        delete _websocketMessageHistory[_index];
                    }
                }
                else if (isSubmissionResultOthersFromFetch(_message)) {
                    const message = _message as SubmissionResultOthersFromFetch;
                    console.log(message);
                    if (message.content.submission_id == submissionId) {
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
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | undefined>(undefined);
    const [, setWebsocketMessageHistory] = useState([]);
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    const [dialogSubmissionNotFoundOpenState, setDialogSubmissionNotFoundOpenState] = useState(false);
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const navigate = useNavigate();

    const handleSubmissionResultFetch = useCallback(() => {
        sendJsonMessage({
            type: "submission_result",
            content: {
                submission_id: submissionId
            }
        });
    }, [sendJsonMessage, submissionId]);

    const convertCodeToRenderString = useCallback((x: string[]) => {
        let renderString: string = "";
        x.map((_s, index) => {
            renderString = renderString + _s.replace("\t", "    ");
            if (index !== x.length - 1) renderString = renderString + '\n';
        });

        return renderString;
    }, []);

    useEffect(() => {
        if (loginStatus.value === false)
            setDialogRequireLoginOpenState(true);
        else
            handleSubmissionResultFetch();
    }, [handleSubmissionResultFetch, loginStatus]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleNavigateLogin = useCallback(() => {
        navigate("/login");
    }, [navigate]);

    const handleNavigateBackward = useCallback(() => {
        navigate(-1);
    }, [navigate]);

    return <div style={{ padding: "4px 0" }}>
        {
            loginStatus
                ?
                <>
                    <div style={{ display: "flex", marginBottom: "10px" }}>
                        <Label style={{ margin: "auto 2px auto 18px" }}>Submission ID: {submissionResult?.submission_id}</Label>
                        {
                            submissionResult !== undefined && submissionResult.result !== "SNF"
                                ?
                                <>
                                    <div style={{ margin: "auto 2px auto 18px" }}>Submission Problem:&nbsp;
                                        <Label style={{ color: "#4183C4" }}
                                            onMouseEnter={(e) => { (e.target as HTMLTableCellElement).style.color = "#0056B3"; (e.target as HTMLTableCellElement).style.cursor = "pointer"; }}
                                            onMouseLeave={(e) => { (e.target as HTMLTableCellElement).style.color = "#4183C4"; (e.target as HTMLTableCellElement).style.cursor = "default"; }}
                                            onClick={() => { navigate("/problem/" + String(submissionResult.problem_number)); }}>
                                            {submissionResult.problem_number}
                                        </Label>
                                    </div>
                                    <Label style={{ margin: "auto 2px auto 18px" }}>Status:&nbsp;</Label>
                                    {
                                        (
                                            submissionResult.result === "PD"
                                                ?
                                                <Spinner size="tiny" label="Waiting..." delay={500} />
                                                :
                                                (
                                                    submissionResult.result === "AC"
                                                        ?
                                                        <><Label style={{ color: "#3AAF00" }}>&nbsp;AC</Label></>
                                                        :
                                                        (
                                                            submissionResult.result === "CE"
                                                                ?
                                                                <><Label style={{ color: "#FDDB10" }}>&nbsp;CE</Label></>
                                                                :
                                                                (
                                                                    submissionResult.result === "WA"
                                                                        ?
                                                                        <><Label style={{ color: "#DA3737" }}>&nbsp;WA</Label></>
                                                                        :
                                                                        <></>
                                                                )

                                                        )

                                                )
                                        )
                                    }
                                    <Label style={{ margin: "auto 2px auto 20px" }}>Score:&nbsp;</Label>
                                    {
                                        submissionResult.general_score !== undefined
                                            ?
                                            <Label style={{
                                                color: (submissionResult.general_score >= 80) ? "#3AAF00" : ((submissionResult.general_score >= 60) ? "#FDDB10" : "#DA3737")
                                            }}>
                                                {submissionResult.general_score}
                                            </Label>
                                            :
                                            <Label>{`-`}</Label>
                                    }

                                    <Label style={{ margin: "auto 2px auto 18px" }}>Language:&nbsp;{submissionResult.language}</Label>
                                    <Label style={{ margin: "auto 2px auto 18px" }}>Submitter:&nbsp;{submissionResult.username}</Label>
                                </>
                                :
                                <></>
                        }
                    </div>
                    {
                        submissionResult !== undefined && submissionResult.scores !== undefined && submissionResult.statuses !== undefined
                            ?
                            <div style={{ margin: "auto 10px", marginBottom: "10px" }}>
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
                                            submissionResult.statuses.map((status, index) => {
                                                const _: number[] = submissionResult.scores as number[];
                                                return <TableRow key={index}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell style={{
                                                        color: status === "AC" ? "#3AAF00" : status === "WA" ? "#DA3737" : "#000643"
                                                    }}>{status}</TableCell>
                                                    <TableCell style={{
                                                        color: _[index] !== 0 ? "#3AAF00" : "#DA3737"
                                                    }}>{_[index]}</TableCell>
                                                </TableRow>;
                                            })
                                        }
                                    </TableBody>
                                </Table>
                            </div>
                            :
                            <></>
                    }

                    {
                        submissionResult !== undefined && submissionResult.code !== undefined
                            ?
                            <div>
                                <div style={{ marginLeft: "18px", display: "flex" }}>
                                    <Label style={{ marginRight: "auto" }}>Code:&nbsp;</Label>
                                    <CopyToTheClipboardButton content={convertCodeToRenderString(submissionResult.code)} />
                                </div>
                                <div>
                                    <Suspense fallback={<Spinner size="tiny" delay={500} />}>
                                        <SyntaxHighlighter showLineNumbers={true} >{convertCodeToRenderString(submissionResult.code)}</SyntaxHighlighter>
                                    </Suspense>

                                </div>
                            </div>
                            :
                            <></>
                    }
                </>
                :
                <></>
        }
        <PopupDialog
            open={dialogSubmissionNotFoundOpenState}
            setPopupDialogOpenState={setDialogSubmissionNotFoundOpenState}
            text={`Submission ${submissionId} is not found!`}
            onClose={handleNavigateBackward} />
        <PopupDialog
            open={dialogRequireLoginOpenState}
            setPopupDialogOpenState={setDialogRequireLoginOpenState}
            text="Please login first."
            onClose={handleNavigateLogin} />
        <SubmissionStatusFetcher
            submissionId={submissionId}
            lastJsonMessage={lastJsonMessage}
            setSubmissionResult={setSubmissionResult}
            setDialogSubmissionNotFoundOpenState={setDialogSubmissionNotFoundOpenState} />
    </div>;
}