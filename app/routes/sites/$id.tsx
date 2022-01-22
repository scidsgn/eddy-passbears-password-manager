import { Site } from "@prisma/client"
import { ActionFunction, json, LoaderFunction, redirect, useActionData, useLoaderData } from "remix"
import Eddy from "~/components/Eddy"
import { decryptPassword, deleteSite, getSite, hashPassword } from "~/utils/crypto.server"
import { checkMasterPassword, getUser } from "~/utils/session.server"

type ActionData = {
    error?: string
    fields?: {
        masterPassword: string
    }
    password?: string
}

function bad(data: ActionData) {
    return json(data, {status: 400})
}

async function decrypt(request: Request, site: Site, form: FormData): Promise<Response> {
    const masterPassword = form.get("masterPassword")

    if (
        typeof masterPassword !== "string"
    ) {
        return bad({
            error: "Incorrect form submission."
        })
    }

    const fields = { masterPassword }

    const correctMasterPassword = await checkMasterPassword(request, masterPassword)
    if (!correctMasterPassword) {
        return bad({
            fields,
            error: "Incorrect master password."
        })
    }

    const ivString = site.encryptedPassword.substring(0, 32)
    const passwString = site.encryptedPassword.substring(32)

    const decrypted = decryptPassword(
        Buffer.from(passwString, "hex"),
        Buffer.from(ivString, "hex"),
        hashPassword(masterPassword)
    )
    if (!decrypted) {
        return bad({
            fields,
            error: "Something happened i guess."
        })
    }

    return bad({
        fields,
        password: decrypted.toString("utf-8")
    })
}

async function del(request: Request, site: Site): Promise<Response> {
    await deleteSite(site)

    return redirect("/sites")
}

export const action: ActionFunction = async({request, params}) => {
    const id = params.id
    if (!id) {
        return bad({
            error: "WTF?"
        })
    }

    const user = await getUser(request);
    if (!user) {
        return bad({
            error: "Not logged in."
        })
    }

    const site = await getSite(user, id)
    if (!site) {
        return bad({
            error: "WTF?"
        })
    }

    const form = await request.formData()
    const action = form.get("actionType")
    if (typeof action !== "string") {
        return bad({
            error: "Incorrect form submission."
        })
    }
    
    if (action === "decrypt") {
        return await decrypt(request, site, form)
    } else if (action === "delete") {
        return await del(request, site)
    }

    return null
}

type LoaderData = {
    site?: Site
}

export const loader: LoaderFunction = async ({request, params}) => {
    const id = params.id
    if (!id) {
        return {}
    }

    const user = await getUser(request)
    if (!user) {
        return {}
    }

    const site = await getSite(user, id)
    if (!site) {
        return redirect("/sites")
    }

    return { site }
}

export default function SiteRoute() {
    const data = useLoaderData<LoaderData>()
    const actionData = useActionData<ActionData>()

    return (
        <div>
            <header className="fancy">
                <h2>{ data?.site?.website }</h2>

                <form method="post">
                    <input type="hidden" name="actionType" value="delete"/>
                    <button type="submit" className="red">Delete site</button>
                </form>
            </header>

            <div className="contents">{
                actionData?.password ? (
                    <div>
                        <h3>Here's your password!</h3>

                        <p>Remember to never give anyone your password and exit this page as soon as possible.</p>

                        <p>Password: <code>{ actionData.password }</code></p>

                        <Eddy pose="decoded"/>
                    </div>
                ) : (
                    <div>
                        <h3>Password locked!</h3>

                        <p>
                            Eddy is keeping your password safe from anyone snooping by storing it in an encrypted form.<br/>
                            Only you can get access to it by typing your master password.
                        </p>

                        {
                            actionData?.error ? (
                                <p className="form-error">
                                    {actionData?.error}
                                </p>
                            ) : null
                        }
            
                        <form method="post" className="buttons">
                            <label>Master password:</label>
                            <input type="hidden" name="actionType" value="decrypt"/>
                            <input type="password" id="master-password" required name="masterPassword" />
                            <button type="submit">Show password</button>
                        </form>

                        <Eddy pose="encoded"/>
                    </div>
                )
            }</div>
        </div>
    )
}