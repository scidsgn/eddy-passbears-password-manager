import { useEffect } from "react"

type ComponentProps = {
    pose: string
}

export default function Eddy({ pose }: ComponentProps) {
    return <img className="eddy" src={`/eddy/${pose}.png`} />
}