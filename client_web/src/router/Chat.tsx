import {
    Outlet,
    useOutletContext,
} from "react-router-dom";

import {
    makeStyles,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableCell,
    TableBody,
    Skeleton,
    Divider,
} from "@fluentui/react-components";

import { useNavigate } from "react-router-dom";

import React, { useEffect, useState, Suspense, useCallback } from "react";

import "../css/style.css";

import * as globals from "./Globals.ts";
const PopupDialog = React.lazy(() => import("./PopupDialog.tsx"));

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

function OnlineUsersListFetcher({ setOnlineUsersList, requestKey, lastJsonMessage }: {
    setOnlineUsersList: React.Dispatch<React.SetStateAction<string[]>>;
    requestKey: string;
    lastJsonMessage: unknown;
}) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        let newOnlineUsersList: string[] = [], changed = false;
        const _websocketMessageHistory = websocketMessageHistory;
        _websocketMessageHistory.map((_message, index) => {
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

        if (changed) setOnlineUsersList(newOnlineUsersList.filter((element) => element !== globals.fetchData("loginUsername")));
        if (!globals.compareArray(_websocketMessageHistory, websocketMessageHistory)) setWebsocketMessageHistory(_websocketMessageHistory);
    }, [websocketMessageHistory, requestKey, setOnlineUsersList]);

    return <div></div>;
}

export function ChatList({ sendJsonMessage, lastJsonMessage }: {
    sendJsonMessage: globals.SendJsonMessage,
    lastJsonMessage: unknown
}) {
    const [, setWebsocketMessageHistory] = useState([]);
    const [onlineUsersList, setOnlineUsersList] = useState([]);
    const [requestKey, setRequestKey] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    const handleLoadOnlineUsersList = useCallback(() => {
        const _requestKey = globals.randomUUID();
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
    const navigate = useNavigate();
    const style = useStyles();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);

    useEffect(() => {
        if (!globals.fetchData("isLoggedIn"))
            setDialogRequireLoginOpenState(true);
    }, []);

    return <div className={style.root}>
        {
            globals.fetchData("isLoggedIn")
                ?
                <>
                    <div className={style.chat_list}>
                        <Suspense fallback={<Skeleton />}>
                            <ChatList
                                sendJsonMessage={sendJsonMessage}
                                lastJsonMessage={lastJsonMessage} />
                        </Suspense>
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
}