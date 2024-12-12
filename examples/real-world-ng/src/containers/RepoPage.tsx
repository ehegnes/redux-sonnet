import React, { useEffect } from 'react'
import * as Actions from '../actions/index.js'
import { Repo } from '../components/Repo'
import { User } from '../components/User'
import { List } from '../components/List'
import { useAppDispatch } from '../store/hooks.js'
import { useParams } from 'react-router-dom'

interface RepoPageProps {
	repo: object | undefined;
	fullName: string;
	name: string;
	owner: object;
	stargazers: any[];
	stargazersPagination: object;
	loadRepoPage: () => void;
	loadMoreStargazers: () => void;
}

export const RepoPage = (props: RepoPageProps) => {
	const dispatch = useAppDispatch();
	const params = useParams();
	const { fullName } = props;

	const { login, name } = params

	//componentWillMount() {
	//  this.props.loadRepoPage(this.props.fullName)
	//}

	useEffect(() => {
		const a = dispatch(Actions.LOAD_REPO_PAGE({ fullName, requiredFields: [] }))
		return () => )
	}, [])

	//componentWillReceiveProps(nextProps) {
	//  if (nextProps.fullName !== this.props.fullName) {
	//    this.props.loadRepoPage(nextProps.fullName)
	//  }
	//}

	//handleLoadMoreClick() {
	//  // eslint-disable-next-line no-console
	//  console.log('load more', this.props.loadMoreStargazers)
	//  this.props.loadMoreStargazers(this.props.fullName)
	//}

	//renderUser(user) {
	//  return <User user={user} key={user.login} />
	//}

	const { repo, owner } = props

	if (!repo || !owner) {
		return (
			<h1>
				<i>Loading {name} details...</i>
			</h1>
		)
	}

	const { stargazers, stargazersPagination } = props

	return (
		<div>
			<Repo repo={repo} owner={owner} />
			<hr />
			<List
				renderItem={this.renderUser}
				items={stargazers}
				onLoadMoreClick={this.handleLoadMoreClick}
				loadingLabel={`Loading stargazers of ${name}...`}
				{...stargazersPagination}
			/>
		</div>
	)
}
}

function mapStateToProps(state) {
	const { login, name } = state.router.params
	const {
		pagination: { stargazersByRepo },
		entities: { users, repos },
	} = state

	const fullName = `${login}/${name}`
	const stargazersPagination = stargazersByRepo[fullName] || { ids: [] }
	const stargazers = stargazersPagination.ids.map((id) => users[id])

	var userid = findKey(users, (user) => {
		return user.login === login
	})

	var repoid = findKey(repos, (repo) => {
		return repo.fullName === fullName
	})

	return {
		fullName,
		name,
		stargazers,
		stargazersPagination,
		repo: repos[repoid],
		owner: users[userid],
	}
}

export default connect(mapStateToProps, {
	loadRepoPage,
	loadMoreStargazers,
})(RepoPage)
