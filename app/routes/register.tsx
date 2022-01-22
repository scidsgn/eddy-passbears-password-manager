import { ActionFunction, json, useActionData, useSearchParams } from "remix"
import zxcvbn from "zxcvbn"
import { createSession, createUser, getUserByEmail } from "~/utils/session.server"
import { validateEmail } from "~/utils/validation"

type ActionData = {
    error?: string
    fields?: {
        email: string
        password: string
        passwordRepeat: string
        masterPassword: string
        masterPasswordRepeat: string
    }
}

function bad(data: ActionData) {
    return json(data, {status: 400})
}

export const action: ActionFunction = async ({request}) => {
    const form = await request.formData()

    const email = form.get("email")
    const password = form.get("password")
    const passwordRepeat = form.get("password2")
    const masterPassword = form.get("masterPassword")
    const masterPasswordRepeat = form.get("masterPassword2")
    const redirect = form.get("redirect") || "/sites"

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof passwordRepeat !== "string" ||
        typeof masterPassword !== "string" ||
        typeof masterPasswordRepeat !== "string" ||
        typeof redirect !== "string"
    ) {
        return bad({
            error: "Incorrect form submission."
        })
    }

    const fields = {
        email, password, passwordRepeat,
        masterPassword, masterPasswordRepeat
    }

    if (!validateEmail(email)) {
        return bad({
            error: "Invalid email address form."
        })
    }

    if (password !== passwordRepeat) {
        return bad({
            fields,
            error: "Password and its repeat don't match."
        })
    }
    if (masterPassword !== masterPasswordRepeat) {
        return bad({
            fields,
            error: "Master password and its repeat don't match."
        })
    }

    const existingUser = await getUserByEmail(email)
    if (existingUser) {
        return bad({
            fields,
            error: `Email already in use.`
        })
    }

    const passwordStrength = zxcvbn(password)
    if (passwordStrength.feedback.warning) {
        return bad({
            fields,
            error: `Password too weak: ${passwordStrength.feedback.warning}.`
        })
    }

    const masterPasswordStrength = zxcvbn(masterPassword)
    if (masterPasswordStrength.feedback.warning) {
        return bad({
            fields,
            error: `Master password too weak: ${masterPasswordStrength.feedback.warning}.`
        })
    }

    const user = await createUser(fields)

    return createSession(user.id, redirect)
}

export default function RegisterRoute() {
    const actionData = useActionData<ActionData>()
    const [searchParams] = useSearchParams()
    
    return (
        <div className="modal">
            <div className="contents">
                <img className="logo" src="/eddy/logo.png"/>
                <h2>Register</h2>

                {
                    actionData?.error ? (
                        <p className="form-error">
                            {actionData?.error}
                        </p>
                    ) : null
                }

                <form method="post" className="buttonGrid">
                    <input type="hidden" name="redirect" value={
                        searchParams.get("redirect") ?? undefined
                    }/>
                    
                    <label htmlFor="register-email">Email</label>
                    <input required type="email" id="register-email" name="email" defaultValue={actionData?.fields?.email}/>

                    <label htmlFor="register-password">Password</label>
                    <input required type="password" id="register-password" name="password" defaultValue={actionData?.fields?.password}/>

                    <label htmlFor="register-password2">Repeat password</label>
                    <input required type="password" id="register-password2" name="password2" defaultValue={actionData?.fields?.passwordRepeat}/>

                    <label htmlFor="register-masterPassword">Master password</label>
                    <input required type="password" id="register-masterPassword" name="masterPassword" defaultValue={actionData?.fields?.masterPassword}/>

                    <label htmlFor="register-masterPassword2">Repeat master password</label>
                    <input required type="password" id="register-masterPassword2" name="masterPassword2" defaultValue={actionData?.fields?.masterPasswordRepeat}/>

                    <div></div>
                    <button type="submit">Register</button>
                </form>
            </div>
        </div>
    )
}