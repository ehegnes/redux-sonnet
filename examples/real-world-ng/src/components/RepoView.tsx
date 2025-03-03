import { Link } from "react-router-dom"
import type { Repo } from "../models.js"

interface RepoProps {
  repo: Repo
}

export const RepoView = (props: RepoProps) => {
  const { repo } = props
  const { name: login } = repo
  const { name, description } = repo

  return (
    <div className="Repo">
      <h3>
        <Link to={`/${login}/${name}`}>{name}</Link>
        {" by "}
        <Link to={`/${login}`}>{login}</Link>
      </h3>
      {description ? <p>{description}</p> : null}
    </div>
  )
}
