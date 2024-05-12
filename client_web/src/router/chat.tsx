// TODO: Implement Chat

import {
    Outlet,
} from "react-router-dom";

import {
    makeStyles,
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
    Skeleton,
} from "@fluentui/react-components";

import { useNavigate } from "react-router-dom";

import { useEffect, useState, Suspense } from "react";

import "../css/style.css";

import * as globals from "./Globals";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        rowGap: "4px",
        columnGap: "4px",
        maxWidth: "250px",
    },
});

export function ChatList() {
    const navigate = useNavigate();
    const onlineUsersList = globals.useWrapPromise(globals.fetchData("onlineUsersList@async"));
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
    </div>;
}

export default function Chat() {
    const navigate = useNavigate();
    const [dialogRequireLoginOpenState, setDialogRequireLoginOpenState] = useState(false);
    useEffect(() => { if (!globals.fetchData("isLoggedIn")) setDialogRequireLoginOpenState(true); }, []);
    return <div className={useStyles().root}>
        {globals.fetchData("isLoggedIn") ? <Suspense fallback={<Skeleton />}><ChatList /></Suspense> : <></>}
        <Dialog modalType="alert" open={dialogRequireLoginOpenState} onOpenChange={(event, data) => setDialogRequireLoginOpenState(data.open)}>
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
        <div>
            <Outlet />
        </div>
    </div>
}