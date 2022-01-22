import { Link, LoaderFunction, redirect, useLoaderData } from "remix"
import { getUser } from "~/utils/session.server"

export const loader: LoaderFunction = async ({request}) => {
    const user = await getUser(request)
    if (user) {
        return redirect("/sites")
    }
    
    return {}
}

export default function IndexRoute() {
    return (
        <div className="home">
            <img src="eddy/hero.png" />
            <div className="buttons">
                <Link className="button green" to="/login">Log in</Link><br/>
                <Link className="button" to="/register">Register</Link>
            </div>
        </div>
    )
}