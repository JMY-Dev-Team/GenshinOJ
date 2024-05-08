// import * as React from "react";
import * as ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
    json,
} from "react-router-dom";

import React from "react";

import Root from "./router/root";
import Login from "./router/login";
import Register from "./router/register";
import Home from "./router/home";
import { Chat, ChatMainUser } from "./router/chat";
import ErrorPage from "./error-page";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Root />,
        loader: () => document.title = "Genshin OJ Root Page",
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/login",
                element: <Login />,
                loader: () => document.title = "Sign in"
            },
            {
                path: "/register",
                element: <Register />,
                loader: () => document.title = "Sign up"
            },
            {
                path: "/home",
                element: <Home />,
                loader: () => document.title = "Home Page"
            },
            {
                path: "/chat",
                element: <Chat />,
                children: [
                    {
                        element: <ChatMainUser />,
                        path: "/chat/user/:uid",
                        loader: async ({ params }) => {
                            document.title = "Chat";
                            return json({ uid: params.uid });
                        },
                    }
                ],
            }
        ]
    }
]);

const rootElement = document.getElementById("root");

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<RouterProvider router={router} />);
} else {
    console.error("Failed to find the root element");
}