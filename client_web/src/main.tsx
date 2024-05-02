// import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

import Root from "./router/root";

import Login from "./router/login";
import Register from "./router/register";
import ErrorPage from "./error-page";
import Home from "./router/home";
import React from "react";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root/>,
        errorElement: <ErrorPage/>,
        children: [
            {
                path: "/login",
                element: <Login/>
            },
            {
                path: "/register",
                element: <Register/>
            },
            {
                path: "/home",
                element: <Home/>
            },
        ]
    }
]);

const rootElement = document.getElementById("root");

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<RouterProvider router={router}/>);
} else {
    console.error("Failed to find the root element");
}