import { useEffect, useState, useCallback, lazy } from "react";
import { useNavigate, Outlet, useOutletContext } from "react-router-dom";

import {
    makeStyles,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableCell,
    TableBody,
    Divider,
    Spinner,
} from "@fluentui/react-components";

import { useSelector } from "react-redux";

import { nanoid } from "nanoid";

const PopupDialog = lazy(() => import("./PopupDialog.tsx"));

import * as globals from "../Globals.ts";
import { RootState } from "../store.ts";

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
    chat_list: {
        flex: "20"
    },
    divider: {
        flex: "1"
    },
    chat_main_outlet: {
        flex: "120"
    }
});

interface OnlineUsersList {
    type: string;
    content: {
        online_users: string[],
        request_key: string,
    };
}

function isOnlineUsersList(x: object) {
    if ('type' in x && 'content' in x && typeof x.content === 'object') {
        return 'online_users' in (x.content as object) &&
            'request_key' in (x.content as object);
    }

    return false;
}

function OnlineUsersListFetcher({ setOnlineUsersList, requestKey, lastJsonMessage }: {
    setOnlineUsersList: React.Dispatch<React.SetStateAction<string[]>>;
    requestKey: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    const loginUsername = useSelector((state: RootState) => state.loginUsername);
    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        let newOnlineUsersList: string[] = [], changed = false;
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
            if (_message && isOnlineUsersList(_message)) {
                const message = _message as OnlineUsersList;
                console.log(message);
                if (message.type === 'online_user' && message.content.request_key === requestKey) {
                    changed = true;
                    newOnlineUsersList = message.content.online_users;
                    delete _websocketMessageHistory[index];
                }
            }
        });

        if (changed) setOnlineUsersList(newOnlineUsersList.filter((element) => element !== loginUsername.value));
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, requestKey, setOnlineUsersList]);

    return <></>;
}

export function ChatList({ sendJsonMessage, lastJsonMessage }: {
    sendJsonMessage: globals.SendJsonMessage,
    lastJsonMessage: unknown
}) {
    const [, setWebsocketMessageHistory] = useState([]);
    const [onlineUsersList, setOnlineUsersList] = useState<string[] | undefined>(undefined);
    const [requestKey, setRequestKey] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleLoadOnlineUsersList = useCallback(() => {
        const _requestKey = nanoid();
        sendJsonMessage({
            type: "online_user",
            content: {
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, [sendJsonMessage]);

    useEffect(() => {
        setRequestKey(handleLoadOnlineUsersList());
    }, [handleLoadOnlineUsersList]);

    return <div>
        <Table size="medium">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>Online User</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    onlineUsersList === undefined ?
                        <Spinner size="tiny" label="Waiting..." delay={500} />
                        :
                        onlineUsersList.map((username: string) => (
                            <TableRow key={username}>
                                <TableCell onClick={() => navigate("/chat/user/" + username)} >{username}</TableCell>
                            </TableRow>
                        )
                        )
                }
            </TableBody>
        </Table>
        <OnlineUsersListFetcher
            setOnlineUsersList={setOnlineUsersList as React.Dispatch<React.SetStateAction<string[]>>}
            lastJsonMessage={lastJsonMessage}
            requestKey={requestKey} />
    </div>;
}

export default function Chat() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    const navigate = useNavigate();
    const style = useStyles();

    useEffect(() => {
        if (loginStatus.value === false)
            setDialogRequireLoginOpenState(true);
    }, [loginStatus]);

    return <>
        <div className={style.root}>
            {
                loginStatus.value === true
                    ?
                    <>
                        <div className={style.chat_list}>
                            <ChatList
                                sendJsonMessage={sendJsonMessage}
                                lastJsonMessage={lastJsonMessage} />
                        </div>
                        <div className={style.divider}>
                            <Divider vertical style={{ height: "100%" }} />
                        </div>
                        <div className={style.chat_main_outlet}>
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
                onClose={() => navigate("/login")} />
        </div>
    </>;
}