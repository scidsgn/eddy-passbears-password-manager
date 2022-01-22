import { ActionFunction, json, redirect, useActionData } from "remix"
import zxcvbn from "zxcvbn";
import { addSite, createIVKey, decryptPassword, encryptPassword, hashPassword } from "~/utils/crypto.server";
import { checkMasterPassword, getUser } from "~/utils/session.server";

type ActionData = {
    error?: string
    fields?: {
        website: string
        password: string
        masterPassword: string
    }
}

function bad(data: ActionData) {
    return json(data, {status: 400})
}

export const action: ActionFunction = async ({request}) => {
    const user = await getUser(request);

    if (!user) {
        return bad({
            error: "Not logged in."
        })
    }

    const form = await request.formData();

    const website = form.get("website")
    const password = form.get("password")
    const masterPassword = form.get("masterPassword")

    if (
        typeof website !== "string" ||
        typeof password !== "string" ||
        typeof masterPassword !== "string"
    ) {
        return bad({
            error: "Incorrect form submission."
        })
    }

    const fields = { website, password, masterPassword }

    const passwordStrength = zxcvbn(password)
    if (passwordStrength.feedback.warning) {
        return bad({
            fields,
            error: `Password too weak: ${passwordStrength.feedback.warning}.`
        })
    }

    const masterCorrect = await checkMasterPassword(request, masterPassword)
    if (!masterCorrect) {
        return bad({
            fields,
            error: "Incorrect master password."
        })
    }

    const site = await addSite(request, fields)
    if (!site) {
        return bad({
            fields,
            error: "Couldn't add entry."
        })
    }

    return redirect(site.id)
}

export default function NewSiteRoute() {
    const actionData = useActionData<ActionData>()
    
    return (
        <div>
            <header className="fancy">
                <h2>Add site</h2>
            </header>

            <div className="contents">{
                    actionData?.error ? (
                        <p className="form-error">
                            {actionData?.error}
                        </p>
                    ) : null
                }

                <form method="post" className="buttonGrid">
                    <label htmlFor="website">Website:</label>
                    <input type="text" id="website" name="website" defaultValue={actionData?.fields?.website} />
                
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" defaultValue={actionData?.fields?.password} />

                    <label htmlFor="naster-password">Master password:</label>
                    <input type="password" id="master-password" name="masterPassword" defaultValue={actionData?.fields?.masterPassword} />

                    <div></div>
                    <button type="submit" className="green">Add</button>
                </form>
            </div>            
        </div>
    )
}