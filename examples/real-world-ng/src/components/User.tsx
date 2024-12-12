import { Link } from 'react-router-dom'

interface UserProps {
	user: {
		avatarUrl: string;
		name: string | undefined;
		login: string;
	}
}

export const User = (props: UserProps) => {
	const { login, avatarUrl, name } = props.user;

	return (
		<div className="User">
			<Link to={`/${login}`}>
				<img src={avatarUrl} width="72" height="72" />
				<h3>
					{login} {name ? <span>({name})</span> : null}
				</h3>
			</Link>
		</div>
	)
}
