import {
    makeStyles,
    shorthands,
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
    Button
} from "@fluentui/react-components";

import { useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";

import "../css/style.css";

import * as globals from "./globals";
import React from "react";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap("4px"),
        maxWidth: "250px",
    },
});

export default function Home() {
    const navigate = useNavigate();
    let content;
    const [onlineUsersList, setOnlineUsersList] = useState([]);
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    useEffect(() => {
        if (globals.getIsLoggedIn()) {
            globals.getOnlineUsersList().then((usersList) => {
                setOnlineUsersList(usersList);
            }).catch((error) => {
                console.error("Error getting online user list:", error);
            });
        } else setDialogRequireLoginOpenState(true);
    }, []);

    return (
        <>
            <div className={useStyles().root}>
                <Table size="medium">
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>Online Username</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {
                            onlineUsersList.map((username) => (
                                    <TableRow key={username}>
                                        <TableCell>{username}</TableCell>
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
                                            navigate("/login");
                                        }
                                    }>Close</Button>
                                </DialogTrigger>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            </div>
        </>
    );
}