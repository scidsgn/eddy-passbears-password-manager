import {
    Links,
    LinksFunction,
    LiveReload,
    Outlet
} from "remix";

import stylesUrl from "./styles/root.css"

export const links: LinksFunction = () => {
    return [
        {
            rel: "stylesheet",
            href: stylesUrl
        }
    ]
}

export default function App() {
    return (
        <html lang="en">
        <head>
            <title>Eddy Passbear's Password Manager</title>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />

            <Links />
        </head>
        <body>
            <Outlet/>
            {process.env.NODE_ENV === "development" && <LiveReload />}
        </body>
        </html>
    );
}
