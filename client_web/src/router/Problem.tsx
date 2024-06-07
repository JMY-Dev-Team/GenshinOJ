import { useEffect, useState, useCallback, lazy } from "react";
import { Outlet, useOutletContext, useNavigate } from "react-router-dom";

import {
    makeStyles,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableCell,
    TableBody,
    Divider,
} from "@fluentui/react-components";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "./Globals.ts";

import "../css/style.css";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        rowGap: "4px",
        columnGap: "4px",
        height: "fill",
        margin: "auto 4px",
    },
});

function ProblemListFetcher({ setProblemList, requestKey, lastJsonMessage }: {
    setProblemList: React.Dispatch<React.SetStateAction<string[] | undefined>>;
    requestKey: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        let newProblemList: string[] = [], changed = false;
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
            interface ProblemSet {
                type: string;
                content: {
                    problem_set: string[],
                    request_key: string
                };
            }

            function isProblemSet(x: object) {
                if ('type' in x && 'content' in x && typeof x.content === 'object') {
                    return 'problem_set' in (x.content as object) && 'request_key' in (x.content as object);
                }

                return false;
            }
            if (_message && isProblemSet(_message)) {
                const message = _message as ProblemSet;
                if (message.content.request_key === requestKey) {
                    changed = true;
                    newProblemList = message.content.problem_set;
                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (changed) setProblemList(newProblemList);
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, requestKey, setProblemList]);

    return <></>;
}

function TableCellForProblemList({ problem_number }: {
    problem_number: string;
}) {
    const navigate = useNavigate();
    const handleClick = useCallback(() => {
        navigate("/problem/" + problem_number);
    }, [navigate, problem_number]);
    return <TableRow key={problem_number}>
        <TableCell onClick={handleClick} >{problem_number}</TableCell>
    </TableRow>;
}

export function ProblemList({ sendJsonMessage, lastJsonMessage }: { sendJsonMessage: globals.SendJsonMessage, lastJsonMessage: unknown }) {
    const [, setWebsocketMessageHistory] = useState<unknown[]>([]);
    const [problemList, setProblemList] = useState<string[] | undefined>([]);
    const [requestKey, setRequestKey] = useState<string>("");

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleLoadProblemList = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "problem_set",
            content: {
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [sendJsonMessage]);

    useEffect(() => {
        setRequestKey(handleLoadProblemList());
    }, [handleLoadProblemList]);

    return <div>
        <Table size="medium">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>Problem List</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    problemList !== undefined
                        ?
                        problemList.map((problem_number: string) => (
                            <TableCellForProblemList problem_number={problem_number} />
                        )
                        )
                        :
                        <></>
                }
            </TableBody>
        </Table>
        <ProblemListFetcher
            setProblemList={setProblemList}
            lastJsonMessage={lastJsonMessage}
            requestKey={requestKey} />
    </div>;
}

export default function Problem() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const navigate = useNavigate();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    const style = useStyles();

    useEffect(() => {
        if (!globals.fetchData("isLoggedIn"))
            setDialogRequireLoginOpenState(true);
    }, []);

    const handleCloseDialogRequireLogin = useCallback(() => {
        navigate("/login");
    }, [navigate]);

    return <>
        <div className={style.root}>
            {
                globals.fetchData("isLoggedIn")
                    ?
                    <>
                        <div style={{ flex: 20 }}>
                            <ProblemList
                                sendJsonMessage={sendJsonMessage}
                                lastJsonMessage={lastJsonMessage} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Divider vertical style={{ height: "100%" }} />
                        </div>
                        <div style={{ flex: 120 }}>
                            <Outlet context={{ sendJsonMessage, lastJsonMessage }} />
                        </div>
                    </>
                    :
                    <></>
            }
            <PopupDialog
                open={dialogRequireLoginOpenState}
                setPopupDialogOpenState={setDialogRequireLoginOpenState}
                text="Please login first."
                onClose={handleCloseDialogRequireLogin} />
        </div>
    </>;
}