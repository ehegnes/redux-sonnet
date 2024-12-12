import { Link } from 'react-router-dom'

interface RepoProps {
	repo: {
		name: string;
		description: string | undefined;
	}
	owner: {
		login: string;
	}
}

export const Repo = (props: RepoProps) => {
	const { repo, owner } = props
	const { login } = owner
	const { name, description } = repo

	return (
		<div className="Repo">
			<h3>
				<Link to={`/${login}/${name}`}>{name}</Link>
				{' by '}
				<Link to={`/${login}`}>{login}</Link>
			</h3>
			{description ? <p>{description}</p> : null}
		</div>
	)
}
