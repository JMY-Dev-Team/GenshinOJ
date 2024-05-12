import * as ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
    json,
} from "react-router-dom";

import React, { Suspense } from "react";

const Root = React.lazy(() => import("./router/Root"));
const Login = React.lazy(() => import("./router/Login"));
const Register = React.lazy(() => import("./router/Register"));
const Home = React.lazy(() => import("./router/Home"));
const Chat = React.lazy(() => import("./router/Chat"));
const ChatMainUser = React.lazy(() => import("./router/ChatMainUser"));
import ErrorPage from "./ErrorPage";
import { Skeleton } from "@fluentui/react-components";
import Logout from "./router/Logout";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Suspense fallback={<Skeleton />}><Root /></Suspense>,
        loader: () => document.title = "Genshin OJ Root Page",
        errorElement: <ErrorPage />,
        children: [
            {
                path: "/login",
                element: <Suspense fallback={<Skeleton />}><Login /></Suspense>,
                loader: () => document.title = "Sign in"
            },
            {
                path: "/register",
                element: <Suspense fallback={<Skeleton />}><Register /></Suspense>,
                loader: () => document.title = "Sign up"
            },
            {
                path: "/home",
                element: <Suspense fallback={<Skeleton />}><Home /></Suspense>,
                loader: () => document.title = "Home Page"
            },
            {
                path: "/chat",
                element: <Suspense fallback={<Skeleton />}><Chat /></Suspense>,
                loader: () => document.title = "Chat",
                children: [
                    {
                        path: "/chat/user/:uid",
                        element: <Suspense fallback={<Skeleton />}><ChatMainUser /></Suspense>,
                        loader: async ({ params }) => {
                            document.title = "Chat User";
                            return json({ uid: params.uid });
                        },
                    }
                ],
            },
            {
                path: "/logout",
                element: <Suspense fallback={<Skeleton />}><Logout /></Suspense>,
                loader: () => document.title = "Home Page"
            },
        ]
    }
]);

const rootElement = document.getElementById("root");

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(<RouterProvider router={router} />);
} else {
    console.error("Failed to find the root element");
}