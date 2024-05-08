import React from "react";
import {
    useLoaderData,
    Outlet,
} from "react-router-dom";

export function Chat() {
    return <div><Outlet /></div>
}

export function ChatMainUser() {
    const loaderData = useLoaderData();
    return <p>{loaderData.uid}</p>
}