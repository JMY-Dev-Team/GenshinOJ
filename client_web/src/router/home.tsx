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
        gap: "4px",
        maxWidth: "250px",
    },
});

export default function Home() {
    return (
        <>
            <div className={useStyles().root}>
                
            </div>
        </>
    );
}