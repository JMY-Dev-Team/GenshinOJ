import React from "react";
import {
    useLoaderData,
    Outlet,
} from "react-router-dom";

import {
    makeStyles,
    Label,
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableCell,
    TableBody,
    Dialog,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogActions,
    DialogTrigger,
    Button,
    Spinner
} from "@fluentui/react-components";

import { useNavigate } from "react-router-dom";

import { useRef, useEffect, useState, Suspense } from "react";

import "../css/style.css";

import * as globals from "./globals";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        gap: "4px 10px",
        maxWidth: "250px",
    },
});

const dataFetcher = globals.fetchOnlineUsersList();

export function ChatList() {
    const navigate = useNavigate();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    return <div>
        <Table size="medium">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>Online User</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    globals.getOnlineUsersList().map((username) => (
                        <TableRow key={username}>
                            <TableCell onClick={ () => { navigate("/chat/user/" + username); } } >{username}</TableCell>
                        </TableRow>
                    )
                    )
                }
            </TableBody>
        </Table>
        <Dialog modalType="alert" open={dialogRequireLoginOpenState} onOpenChange={(event, data) => {
            setDialogRequireLoginOpenState(data.open);
        }}>
            <DialogSurface>
                <DialogBody>
                    <DialogContent>
                        Please login first.
                    </DialogContent>
                    <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                            <Button appearance="primary" onClick={
                                () => {
                                    setDialogRequireLoginOpenState(false);
                                    navigate("/login");
                                }
                            }>Close</Button>
                        </DialogTrigger>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    </div>;
}

export function ChatMainUser() {
    const loaderData = useLoaderData();
    const [messageList, setMessageList] = useState([]);
    const addMessagetoMessageList = (_from, _message) => {
        const newMessage = { from: _from, message: _message };
        setMessageList([...messageList, newMessage]);
    };

    return <div>
        {
            messageList.map(({from, message}) => {
                return <Label>message</Label>;
            })
        }
    </div>;
}

export function Chat() {
    const navigate = useNavigate();
    return <div className={useStyles().root}>
        <ChatList />
        <div>
            <Outlet />
        </div>
    </div>
}