import { Outlet } from "react-router-dom";

import {
    FluentProvider,
    webLightTheme
} from "@fluentui/react-components";

import NavBar from "./Navbar";

import "../css/style.css";

export default function Root() {
    return (
        <FluentProvider theme={webLightTheme}>
            <NavBar />
            <div>
                <Outlet />
            </div>
        </FluentProvider>
    );
}