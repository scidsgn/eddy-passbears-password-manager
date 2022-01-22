import { ActionFunction, json, useActionData, useSearchParams } from "remix"
import { applyLoginStrike, checkLoginPassword, createSession, getUserByEmail, isLoginAllowed, setAttemptCount } from "~/utils/session.server";
import { validateEmail } from "~/utils/validation";

type ActionData = {
    error?: string
    fields?: {
        email: string
        password: string
    }
}

function wait(interval: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), interval)
    })
}

function bad(data: ActionData) {
    return json(data, {status: 400})
}

export const action: ActionFunction = async ({request}) => {
    const form = await request.formData()

    const email = form.get("email")
    const password = form.get("password")
    const redirect = form.get("redirect") || "/sites"

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof redirect !== "string"
    ) {
        return bad({
            error: "Incorrect form submission."
        })
    }

    const fields = { email, password }

    if (!validateEmail(email)) {
        return bad({
            error: "Invalid email address form."
        })
    }

    await wait(2000)

    const user = await getUserByEmail(email)
    if (!user) {
        return bad({
            fields,
            error: "Incorrect email or password."
        })
    }

    if (!isLoginAllowed(user)) {
        return bad({
            fields,
            error: "Login temporarily disabled after exceeding the number of incorrect attempts."
        })
    }

    let attemptCount = user.attemptCount ?? 0

    const passwordCorrect = await checkLoginPassword(user, password)
    if (!passwordCorrect) {
        attemptCount += 1
        if (attemptCount >= 5) {
            await applyLoginStrike(user)

            return bad({
                fields,
                error: "Too many incorrect attempts. Login disabled for 15 minutes."
            })
        } else {
            await setAttemptCount(user, attemptCount)
        }

        return bad({
            fields,
            error: "Incorrect email or password."
        })
    } else {
        await setAttemptCount(user, 0)
    }

    return createSession(user.id, redirect)
}

export default function LoginRoute() {
    const actionData = useActionData<ActionData>()
    const [searchParams] = useSearchParams()

    return (
        <div className="modal">
            <div className="contents">
                <img className="logo" src="/eddy/logo.png"/>
                <h2>Log in</h2>

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

                    <label htmlFor="login-email">Email</label>
                    <input required type="email" id="login-email" name="email" defaultValue={actionData?.fields?.email}/>
                    
                    <label htmlFor="login-password">Password</label>
                    <input required type="password" id="login-password" name="password" defaultValue={actionData?.fields?.password}/>
                    
                    <div></div>
                    <button type="submit">Log in</button>
                </form>
            </div>
        </div>
    )
}