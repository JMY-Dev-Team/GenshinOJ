// TODO: Implement Chat

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

import { useEffect, useState, Suspense, useCallback } from "react";

import "../css/style.css";

import * as globals from "./Globals";
import PopupDialog from "./PopupDialog";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        rowGap: "4px",
        columnGap: "4px",
        height: "fill",
    },
});

function OnlineUsersListFetcher({ websocketMessageHistory, setOnlineUsersList, requestKey }) {
    useEffect(() => {
        let newOnlineUsersList = [], changed = false;
        websocketMessageHistory.map((message, index) => {
            if (message) {
                if (message.content.request_key === requestKey) {
                    changed = true;
                    newOnlineUsersList = message.content.online_users;
                    delete websocketMessageHistory[index];
                }
            }
        });

        if (changed) setOnlineUsersList(newOnlineUsersList.filter((element) => element !== globals.fetchData("loginUsername")));
    }, [websocketMessageHistory]);

    return <div></div>;
}

export function ChatList({ sendJsonMessage, lastJsonMessage, websocketMessageHistory, setWebsocketMessageHistory }) {

    const [onlineUsersList, setOnlineUsersList] = useState([]);
    const [requestKey, setRequestKey] = useState("");
    const navigate = useNavigate();

    const handleLoadOnlineUsersList = useCallback(() => {
        const _requestKey = globals.randomUUID();
        sendJsonMessage({
            type: "online_user",
            content: {
                request_key: _requestKey
            }
        });

        return _requestKey;
    }, []);

    useEffect(() => {
        setRequestKey(handleLoadOnlineUsersList());
    }, []);

    useEffect(() => {
        if (lastJsonMessage !== null)
            setWebsocketMessageHistory((previousMessageHistory) => previousMessageHistory.concat(lastJsonMessage));
    }, [lastJsonMessage]);

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
        <OnlineUsersListFetcher websocketMessageHistory={websocketMessageHistory} setOnlineUsersList={setOnlineUsersList} requestKey={requestKey} />
    </div>;
}

export default function Chat() {
    const { sendJsonMessage, lastJsonMessage, websocketMessageHistory, setWebsocketMessageHistory } = useOutletContext();
    const navigate = useNavigate();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    useEffect(() => { if (!globals.fetchData("isLoggedIn")) setDialogRequireLoginOpenState(true); }, []);
    return <div className={useStyles().root}>
        {
            globals.fetchData("isLoggedIn")
                ?
                <>
                    <div style={{ flex: 20 }}>
                        <Suspense fallback={<Skeleton />}>
                            <ChatList sendJsonMessage={sendJsonMessage}
                                lastJsonMessage={lastJsonMessage}
                                websocketMessageHistory={websocketMessageHistory}
                                setWebsocketMessageHistory={setWebsocketMessageHistory} />
                        </Suspense>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Divider vertical style={{ height: "100%" }} />
                    </div>
                    <div style={{ flex: 120 }}>
                        <Outlet context={{ sendJsonMessage, lastJsonMessage, websocketMessageHistory, setWebsocketMessageHistory }} />
                    </div>
                </>
                :
                <></>
        }
        <PopupDialog open={dialogRequireLoginOpenState} setPopupDialogOpenState={setDialogRequireLoginOpenState} text="Please login first." onClose={() => navigate("/login")}></PopupDialog>
    </div>
}