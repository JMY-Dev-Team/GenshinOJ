import { Outlet } from "react-router-dom";

import {
    FluentProvider,
    webLightTheme
} from "@fluentui/react-components";

import NavBar from "./navbar";

import "../css/style.css";
import React from "react";

export default function Root() {
    return (
        <FluentProvider theme={webLightTheme}>
            <NavBar/>
            <div>
                <Outlet/>
            </div>
        </FluentProvider>
    );
}