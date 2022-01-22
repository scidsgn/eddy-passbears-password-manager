import { Site, User } from "@prisma/client";
import { Link, LinksFunction, LoaderFunction, Outlet, redirect, useLoaderData } from "remix";
import { getSites } from "~/utils/crypto.server";
import { getUser } from "~/utils/session.server";

import stylesUrl from "../styles/sites.css"

type LoaderData = {
    user: User | null,
    sites: Site[]
}

export const loader: LoaderFunction = async ({request}) => {
    const user = await getUser(request)
    if (!user) {
        return redirect("/")
    }

    const sites = await getSites(user)
    
    return { user, sites } as LoaderData
}

export const links: LinksFunction = () => {
    return [
        {
            rel: "stylesheet",
            href: stylesUrl
        }
    ]
}

export default function SitesRoute() {
    const data = useLoaderData<LoaderData>()
    if (!data.user) {
        return (
            <p>uh oh!</p>
        )
    }

    return (
        <div className="app">
            <header>
                <Link to="/sites" style={{fontSize: 0}}>
                    <img className="logo" src="/eddy/logo.png"/>
                </Link>

                <div className="separator"></div>

                <div className="buttons">
                    <p className="user-name">{data.user.email}</p>
                    <form action="/logout" method="post">
                        <button type="submit" className="red">Log out</button>
                    </form>
                </div>
            </header>
            <aside>
                <Link className="button green" to="new">Add site</Link>

                <ul className="sites-list">
                    {
                        data.sites.map((site, i) => (
                            <li key={i}>
                                <Link className="website button white" to={site.id}>
                                    { site.website }
                                </Link>
                            </li>
                        ))
                    }
                </ul>
            </aside>
            <main>
                <Outlet/>
            </main>
        </div>
    )
}