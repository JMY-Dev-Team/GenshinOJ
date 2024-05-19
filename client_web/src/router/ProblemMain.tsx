import "../css/style.css";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useLoaderData, useNavigate, useOutletContext } from "react-router-dom";
import Editor from '@monaco-editor/react';
import * as globals from "./Globals"
import { Button, Spinner, Text } from "@fluentui/react-components";
import PopupDialog from "./PopupDialog";

interface ProblemInfoFromLoader {
    problemNumber: string;
}

type ProblemInfoFromFetcher = {
    problem_number: number;
    difficulty: number;
    problem_name: string;
    problem_statement: string[];
}

function ProblemInfoFetcher({ lastJsonMessage, setProblemInfo, requestKey }: {
    lastJsonMessage: unknown;
    setProblemInfo: React.Dispatch<React.SetStateAction<ProblemInfoFromFetcher>>;
    requestKey: string;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, _index) => {
            interface ProblemStatement {
                type: string;
                content: {
                    problem_number: number,
                    difficulty: number,
                    problem_name: string,
                    problem_statement: string[],
                    request_key: string
                };
            }

            function isProblemStatement(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'problem_number' in (x.content as object) &&
                        'difficulty' in (x.content as object) &&
                        'problem_name' in (x.content as object) &&
                        'problem_statement' in (x.content as object) &&
                        'request_key' in (x.content as object);
                }

                return false;
            }

            if (_message && isProblemStatement(_message)) {
                const message = _message as ProblemStatement;
                console.log(message);
                if (message.content.request_key == requestKey) {
                    setProblemInfo({
                        problem_number: message.content.problem_number as number,
                        difficulty: message.content.difficulty as number,
                        problem_name: message.content.problem_name as string,
                        problem_statement: message.content.problem_statement as string[]
                    });
                    delete _websocketMessageHistory[_index];
                }
            }
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, requestKey, setProblemInfo]);
    return <div></div>;
}

function SubmissionIdFetcher({ lastJsonMessage, requestKey, setSubmissionId, setDialogSubmitSuccessOpenState }: {
    lastJsonMessage: unknown;
    setSubmissionId: React.Dispatch<React.SetStateAction<number>>;
    setDialogSubmitSuccessOpenState: React.Dispatch<React.SetStateAction<boolean>>;
    requestKey: string;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, _index) => {
            interface SubmissionId {
                type: string;
                content: {
                    submission_id: number;
                    request_key: string;
                };
            }

            function isSubmissionId(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'submission_id' in (x.content as object) &&
                        'request_key' in (x.content as object);
                }

                return false;
            }

            if (_message && isSubmissionId(_message)) {
                const message = _message as SubmissionId;
                console.log(message);
                if (message.content.request_key == requestKey) {
                    setSubmissionId(message.content.submission_id);
                    setDialogSubmitSuccessOpenState(true);
                    delete _websocketMessageHistory[_index];
                }
            }
        });

        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, requestKey, setSubmissionId, setDialogSubmitSuccessOpenState]);

    return <div></div>;
}

export default function ProblemMain() {
    const { problemNumber } = (useLoaderData() as ProblemInfoFromLoader);
    const [, setWebsocketMessageHistory] = useState([]);
    const [submissionCode, setSubmissionCode] = useState("");
    const [submissionId, setSubmissionId] = useState(-1);
    // TODO(JackMerryYoung): Add Multi-language support (Add a Dropdown Component provided to select the language of code.)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [submissionCodeLanguage, setSubmissionCodeLanguage] = useState("cpp")
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [problemInfo, setProblemInfo] = useState({} as ProblemInfoFromFetcher);
    const [requestKey, setRequestKey] = useState("");
    const [dialogSubmitSuccessOpenState, setDialogSubmitSuccessOpenState] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleLoadProblemInfo = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "problem_statement",
            content: {
                problem_number: problemNumber,
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [problemNumber, sendJsonMessage]);

    const handleClickSubmitCode = useCallback(() => {
        const request_key = globals.randomUUID();
        sendJsonMessage({
            type: "submission",
            content: {
                username: globals.fetchData("loginUsername"),
                session_token: globals.fetchData("sessionToken"),
                problem_number: problemNumber,
                language: submissionCodeLanguage,
                code: submissionCode.split('\n'),
                request_key: request_key
            }
        });
        return request_key;
    }, [problemNumber, sendJsonMessage, submissionCode, submissionCodeLanguage]);

    useEffect(() => {
        setRequestKey(handleLoadProblemInfo());
    }, [handleLoadProblemInfo]);

    return <>
        <h2>Problem Statement</h2>
        {
            problemInfo && (problemInfo as ProblemInfoFromFetcher).problem_statement
                ?
                (problemInfo as ProblemInfoFromFetcher).problem_statement.map((statement, index) => (
                    <Text as="p" key={index}>{statement}</Text>
                )
                )
                :
                <></>
        }
        <ProblemInfoFetcher
            lastJsonMessage={lastJsonMessage}
            setProblemInfo={setProblemInfo}
            requestKey={requestKey} />
        <br />
        <h2>Submit Code</h2>
        <Suspense fallback={<Spinner />}>
            <Editor
                height="70%"
                defaultLanguage="cpp"
                onChange={(code,) => { setSubmissionCode((code === undefined) ? "" : code); }} />
        </Suspense>
        <Button appearance="primary" onClick={() => { setRequestKey(handleClickSubmitCode); }}>Submit</Button>
        <SubmissionIdFetcher
            lastJsonMessage={lastJsonMessage}
            setSubmissionId={setSubmissionId}
            setDialogSubmitSuccessOpenState={setDialogSubmitSuccessOpenState}
            requestKey={requestKey} />
        <PopupDialog
            open={dialogSubmitSuccessOpenState}
            setPopupDialogOpenState={setDialogSubmitSuccessOpenState}
            text="Submit Successfully. Navigating to your submission..."
            onClose={() => { navigate("/submission/" + submissionId); }} />
    </>;
}