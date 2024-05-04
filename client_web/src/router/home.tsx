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
    Button,
    useRestoreFocusTarget
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
    const [onlineUsersList, setOnlineUsersList] = useState([]);
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    const restoreFocusTargetAttribute = useRestoreFocusTarget();
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
                <Table size="medium" {...restoreFocusTargetAttribute}>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>Online User</TableHeaderCell>
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
                                            setDialogRequireLoginOpenState(false);
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