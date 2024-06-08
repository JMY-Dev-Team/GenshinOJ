import { Suspense, useCallback, useEffect, useState, lazy } from "react";
import { useLoaderData, useNavigate, useOutletContext } from "react-router-dom";

import { Button, Dropdown, Spinner, Subtitle1, Tag, Option, Title3, DropdownProps, SelectionEvents, OptionOnSelectData } from "@fluentui/react-components";
import { AlignBottomFilled, AlignBottomRegular, AlignStretchHorizontalFilled, AlignStretchHorizontalRegular, AppGenericFilled, AppGenericRegular, AppsAddInRegular, ArrowRoutingRectangleMultipleRegular } from "@fluentui/react-icons";

const Editor = lazy(() => import("@monaco-editor/react"));
const Markdown = lazy(() => import("react-markdown"));
const rehypeKatex = (await import("rehype-katex")).default;
const remarkMath = (await import("remark-math")).default;

import { useSelector } from "react-redux";

import { nanoid } from "nanoid";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "../Globals.ts";
import { RootState } from "../store.ts";

import 'katex/dist/katex.min.css';
import "../css/style.css";

interface ProblemInfoFromLoader {
    problemNumber: number;
}

interface ProblemInfoFromFetcher {
    problem_number: number;
    difficulty: number;
    problem_name: string;
    problem_statement: string[];
}

const options = [
    {
        description: "C",
        codeLanguage: "c",
        submissionCodeLanguage: "c"
    },
    {
        description: "C++",
        codeLanguage: "cpp",
        submissionCodeLanguage: "cpp"
    },
    {
        description: "Java",
        codeLanguage: "java",
        submissionCodeLanguage: "java"
    },
    {
        description: "Python",
        codeLanguage: "python",
        submissionCodeLanguage: "py"
    }
];

function ProblemInfoFetcher({ lastJsonMessage, setProblemInfo, requestKey }: {
    lastJsonMessage: unknown;
    setProblemInfo: React.Dispatch<React.SetStateAction<ProblemInfoFromFetcher | undefined>>;
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
    return <></>;
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

    return <></>;
}

function DifficultyShower({ difficulty }: {
    difficulty: number;
}) {
    if (difficulty == 0)
        return <Tag appearance="outline" icon={<AlignBottomRegular style={{ fontSize: "0.8em" }} />} style={{ color: "#999999" }}>Unknown</Tag>;
    if (difficulty == 1)
        return <Tag appearance="outline" icon={<AlignBottomFilled style={{ fontSize: "0.8em" }} />} style={{ color: "#DA3737" }}>Beginner</Tag>;
    if (difficulty == 2)
        return <Tag appearance="outline" icon={<AlignStretchHorizontalRegular style={{ fontSize: "0.8em" }} />} style={{ color: "#CC7700" }}>Primary</Tag>;
    if (difficulty == 3)
        return <Tag appearance="outline" icon={<AlignStretchHorizontalFilled style={{ fontSize: "0.8em" }} />} style={{ color: "#FDDB10" }}>Junior</Tag>;
    if (difficulty == 4)
        return <Tag appearance="outline" icon={<AppGenericRegular style={{ fontSize: "0.8em" }} />} style={{ color: "#3AAF00" }}>Senior</Tag>;
    if (difficulty == 5)
        return <Tag appearance="outline" icon={<AppGenericFilled style={{ fontSize: "0.8em" }} />} style={{ color: "#2744C2" }}>Advanced</Tag>;
    if (difficulty == 6)
        return <Tag appearance="outline" icon={<AppsAddInRegular style={{ fontSize: "0.8em" }} />} style={{ color: "#773388" }}>Hard</Tag>;
    if (difficulty == 7)
        return <Tag appearance="outline" icon={<ArrowRoutingRectangleMultipleRegular style={{ fontSize: "0.8em" }} />} style={{ color: "#1C1C3C" }}>Grand</Tag>;
}

export default function ProblemMain() {
    const { problemNumber } = (useLoaderData() as ProblemInfoFromLoader);
    const [, setWebsocketMessageHistory] = useState([]);
    const [submissionCode, setSubmissionCode] = useState("");
    const [submissionId, setSubmissionId] = useState(-1);
    const [submissionCodeLanguage, setSubmissionCodeLanguage] = useState("cpp");
    const [codeLanguage, setCodeLanguage] = useState("cpp");
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const [problemInfo, setProblemInfo] = useState<ProblemInfoFromFetcher | undefined>(undefined);
    const [requestKeyOfProblemInfoFetcher, setRequestKeyOfProblemInfoFetcher] = useState("");
    const [requestKeyOfSubmissionIdFetcher, setRequestKeyOfSubmissionIdFetcher] = useState("");
    const [dialogSubmitSuccessOpenState, setDialogSubmitSuccessOpenState] = useState(false);
    const [convertedMarkdownRenderString, setConvertedMarkdownRenderString] = useState("");
    const loginUsername = useSelector((state: RootState) => state.loginUsername);
    const sessionToken = useSelector((state: RootState) => state.sessionToken);
    const navigate = useNavigate();

    useEffect(() => {
        if (lastJsonMessage !== null) setWebsocketMessageHistory((previousMessage) => previousMessage.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleLoadProblemInfo = useCallback(() => {
        const _requestKey = nanoid();
        sendJsonMessage({
            type: "problem_statement",
            content: {
                problem_number: problemNumber,
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [problemNumber, sendJsonMessage]);

    const handleSubmitCode = useCallback(() => {
        console.log("`handleSubmitCode()` triggered.");
        const request_key = nanoid();
        sendJsonMessage({
            type: "submission",
            content: {
                username: loginUsername.value,
                session_token: sessionToken.value,
                problem_number: problemNumber,
                language: submissionCodeLanguage,
                code: submissionCode.split('\n'),
                request_key: request_key
            }
        });

        return request_key;
    }, [problemNumber, sendJsonMessage, submissionCode, submissionCodeLanguage]);

    useEffect(() => {
        setRequestKeyOfProblemInfoFetcher(handleLoadProblemInfo());
    }, [handleLoadProblemInfo]);

    const handleClickSubmitCode = useCallback(() => {
        console.log("`handleClickSubmitCode()` triggered.");
        setRequestKeyOfSubmissionIdFetcher(handleSubmitCode());
    }, [handleSubmitCode]);

    const convertStringListToMarkdownRenderString = useCallback((_problemInfo: ProblemInfoFromFetcher) => {
        let markdownRenderString: string = "";
        _problemInfo.problem_statement.map((statement) => {
            markdownRenderString = markdownRenderString +
                `
${statement}
`
        });

        return markdownRenderString;
    }, []);

    useEffect(() => {
        if (problemInfo !== undefined)
            setConvertedMarkdownRenderString(convertStringListToMarkdownRenderString(problemInfo));
    }, [convertStringListToMarkdownRenderString, problemInfo]);

    const handleSubmissionNavigate = useCallback(() => {
        navigate("/submission/" + submissionId);
    }, [submissionId, navigate]);

    const handleEditorContentChange = useCallback((code: string | undefined,) => {
        setSubmissionCode((code === undefined) ? "" : code);
    }, []);

    return <>
        <Suspense fallback={<Spinner delay={100} />}>
            <div style={{ display: "block", marginLeft: "0.5em", marginTop: "0.5em" }}>
                {
                    problemInfo && (problemInfo as ProblemInfoFromFetcher).problem_statement
                        ?
                        <>
                            <Title3>
                                P{(problemInfo as ProblemInfoFromFetcher).problem_number} - {(problemInfo as ProblemInfoFromFetcher).problem_name}
                            </Title3>
                            &nbsp;&nbsp;&nbsp;&nbsp;
                            <DifficultyShower difficulty={(problemInfo as ProblemInfoFromFetcher).difficulty} />
                            <div style={{ display: "block", marginLeft: "1em" }}>
                                <Subtitle1>Problem Statement</Subtitle1>
                                <div style={{ textIndent: "1em", marginTop: "1em" }}>
                                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {convertedMarkdownRenderString}
                                    </Markdown>
                                </div>
                                <Subtitle1>Submit Code</Subtitle1>
                                <CodeLanguageChooser setCodeLanguage={setCodeLanguage} setSubmissionCodeLanguage={setSubmissionCodeLanguage} style={{ marginTop: "0.5em", marginBottom: "1em" }} />
                                <Editor
                                    height="500px"
                                    language={codeLanguage}
                                    onChange={handleEditorContentChange}
                                    loading={<Spinner delay={200} />} />
                                <div style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>
                                    <Button appearance="primary" onClick={handleClickSubmitCode}>Submit</Button>
                                </div>
                            </div>
                        </>
                        :
                        <></>
                }
            </div>
        </Suspense>
        <ProblemInfoFetcher
            lastJsonMessage={lastJsonMessage}
            setProblemInfo={setProblemInfo}
            requestKey={requestKeyOfProblemInfoFetcher} />
        <SubmissionIdFetcher
            lastJsonMessage={lastJsonMessage}
            setSubmissionId={setSubmissionId}
            setDialogSubmitSuccessOpenState={setDialogSubmitSuccessOpenState}
            requestKey={requestKeyOfSubmissionIdFetcher} />
        <PopupDialog
            open={dialogSubmitSuccessOpenState}
            setPopupDialogOpenState={setDialogSubmitSuccessOpenState}
            text="Submit Successfully. Navigating to your submission..."
            onClose={handleSubmissionNavigate} />
    </>;
}

function CodeLanguageChooser({ setCodeLanguage, setSubmissionCodeLanguage, style, ...props }: {
    setCodeLanguage: React.Dispatch<React.SetStateAction<string>>;
    setSubmissionCodeLanguage: React.Dispatch<React.SetStateAction<string>>;
    style?: React.CSSProperties;
} & Partial<{
    props: DropdownProps;
}>) {
    const [, setSelectedOptions] = useState(["cpp cpp"]);
    const handleOptionSelect = useCallback((_ev: SelectionEvents, data: OptionOnSelectData) => {
        if (data.optionValue) {
            setSelectedOptions(data.selectedOptions);
            setCodeLanguage(data.optionValue.split(' ')[1]);
            setSubmissionCodeLanguage(data.optionValue.split(' ')[0]);
        }
    }, [setCodeLanguage, setSubmissionCodeLanguage]);

    return (
        <div style={style}>
            <Dropdown placeholder="Code Language" onOptionSelect={handleOptionSelect} defaultValue="C++" defaultSelectedOptions={["cpp cpp"]} {...props}>
                {
                    options.map((option) => (
                        <Option value={option.submissionCodeLanguage + ' ' + option.codeLanguage} key={option.submissionCodeLanguage + ' ' + option.codeLanguage}>{option.description}</Option>
                    ))
                }
            </Dropdown>
        </div>
    );
}