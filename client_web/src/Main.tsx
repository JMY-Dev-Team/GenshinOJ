import * as ReactDOM from "react-dom/client";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";

import React, { Suspense } from "react";

const Root = React.lazy(() => import("./router/Root.tsx"));
const Login = React.lazy(() => import("./router/Login.tsx"));
const Register = React.lazy(() => import("./router/Register.tsx"));
const Home = React.lazy(() => import("./router/Home.tsx"));
const Chat = React.lazy(() => import("./router/Chat.tsx"));
const ChatMainUser = React.lazy(() => import("./router/ChatMainUser.tsx"));
const Problem = React.lazy(() => import("./router/Problem.tsx"));
const ProblemMain = React.lazy(() => import("./router/ProblemMain.tsx"));
const SubmissionShower = React.lazy(() => import("./router/SubmissionShower.tsx"));
const SubmissionsList = React.lazy(() => import("./router/SubmissionsList.tsx"));

import ErrorPage from "./ErrorPage.tsx";
import { Skeleton } from "@fluentui/react-components";
import Logout from "./router/Logout.tsx";

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
                        path: "/chat/user/:username",
                        element: <Suspense fallback={<Skeleton />}><ChatMainUser /></Suspense>,
                        loader: ({ params }) => {
                            document.title = "Chat User";
                            return { toUsername: params.username };
                        },
                    }
                ],
            },
            {
                path: "/problem",
                element: <Suspense fallback={<Skeleton />}><Problem /></Suspense>,
                loader: () => document.title = "Problem",
                children: [
                    {
                        path: "/problem/:problem_number",
                        element: <Suspense fallback={<Skeleton />}><ProblemMain /></Suspense>,
                        loader: ({ params }) => {
                            document.title = "Problem " + params.problem_number;
                            return { problemNumber: Number(params.problem_number) };
                        },
                    }
                ],
            },
            {
                path: "/submission",
                element: <Suspense fallback={<Skeleton />}><SubmissionsList /></Suspense>,
                loader: () => document.title = "Submissions List",
            },
            {
                path: "/submission/:submission_id",
                element: <Suspense fallback={<Skeleton />}><SubmissionShower /></Suspense>,
                loader: ({ params }) => {
                    document.title = "Submission " + params.submission_id;
                    return { submissionId: Number(params.submission_id) };
                },
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