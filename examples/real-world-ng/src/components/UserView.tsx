import { Link } from "react-router-dom"
import { User } from "../models/User.js"
import * as O from "effect/Option"

interface UserViewProps {
  user: User
}

export const UserView = (props: UserViewProps) => {
  const { login, avatar_url, name } = props.user

  const nameView = O.match(name, {
    onNone: () => null,
    onSome: (name) => <span>{name}</span>,
  })

  return (
    <div className="User">
      <Link to={`/${login}`}>
        <img src={avatar_url} width="72" height="72" />
        <h3>
          {login} {nameView}
        </h3>
      </Link>
    </div>
  )
}
