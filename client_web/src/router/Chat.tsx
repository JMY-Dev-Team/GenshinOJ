import { useEffect, useState, lazy } from "react";
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
        columnGap: "0.3em",
        marginLeft: "0.3em"
    },
    chat_list: {
        width: "calc((100vw - 30.2px) * 0.15)",
    },
    divider: {
        width: "calc((100vw - 30.2px) * 0.01)",
    },
    chat_main_outlet: {
        width: "calc((100vw - 30.2px) * 0.84)",
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

function useOnlineUsersList(
    sendJsonMessage: globals.SendJsonMessage,
    lastJsonMessage: unknown,
) {
    const [websocketMessageHistory, setWebsocketMessageHistory] = useState([]);
    const [onlineUsersList, setOnlineUsersList] = useState<string[] | undefined>(undefined);
    const loginUsername = useSelector((state: RootState) => state.loginUsername);
    const [requestKey, setRequestKey] = useState("");

    const fetchOnlineUsersList = () => {
        const _requestKey = nanoid();
        sendJsonMessage({
            type: "online_user",
            content: {
                request_key: _requestKey
            }
        });

        setRequestKey(_requestKey);
    };

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
    }, [websocketMessageHistory, requestKey]);

    return { onlineUsersList, fetchOnlineUsersList };
}

export function ChatList({ sendJsonMessage, lastJsonMessage }: {
    sendJsonMessage: globals.SendJsonMessage,
    lastJsonMessage: unknown
}) {
    const [, setWebsocketMessageHistory] = useState([]);
    const { onlineUsersList, fetchOnlineUsersList } = useOnlineUsersList(sendJsonMessage, lastJsonMessage);
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const navigate = useNavigate();

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage as []));
    }, [lastJsonMessage]);

    useEffect(() => {
        if (loginStatus.value === true) fetchOnlineUsersList();
    }, [loginStatus]);

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
    </div>;
}

export default function Chat() {
    const { sendJsonMessage, lastJsonMessage } = useOutletContext<globals.WebSocketHook>();
    const loginStatus = useSelector((state: RootState) => state.loginStatus);
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    const navigate = useNavigate();
    const style = useStyles();

    useEffect(() => {
        const localLoginStatus = localStorage.getItem("loginStatus");
        if (localLoginStatus === null || (loginStatus.value === false && localLoginStatus !== null && JSON.parse(localLoginStatus) === false))
            setDialogRequireLoginOpenState(true);
    }, [loginStatus]);

    return <>
        {
            loginStatus.value && (
                <div className={style.root}>
                    <div className={style.chat_list}>
                        <ChatList
                            sendJsonMessage={sendJsonMessage}
                            lastJsonMessage={lastJsonMessage} />
                    </div>
                    <div className={style.divider}>
                        <Divider vertical style={{ height: "calc(100vh - 8.8em)" }} />
                    </div>
                    <div className={style.chat_main_outlet}>
                        <Outlet context={{ sendJsonMessage, lastJsonMessage }} />
                    </div>
                </div>
            )
        }

        <PopupDialog
            open={dialogRequireLoginOpenState}
            setPopupDialogOpenState={setDialogRequireLoginOpenState}
            text="Please login first."
            onClose={() => navigate("/login")} />
    </>;
}