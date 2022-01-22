import Eddy from "~/components/Eddy";

export default function SitesIndexRoute() {
    return (
        <div>
            <header className="fancy">
                <h2>Welcome!</h2>
            </header>
            <div className="contents">
                Welcome to <b>Eddy Passbear's Password Manager</b>. Eddy can help you store your most precious password in a secure and convenient way!

                <h3>How do I know my passwords are secure?</h3>
                Eddy wouldn't steal your passwords! I mean just look at him!
            </div>

            <Eddy pose="wave"/>
        </div>
    )
}