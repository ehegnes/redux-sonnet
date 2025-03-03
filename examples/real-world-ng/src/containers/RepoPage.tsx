import React, { useEffect } from "react"
import * as Actions from "../actions.js"
import { RepoView } from "../components/RepoView.jsx"
import { UserView } from "../components/UserView.jsx"
import { useAppDispatch, useAppSelector } from "../store/hooks.js"
import { ListView } from "../components/ListView.jsx"
import { User } from "../models.js"
import { selectRepo, selectUser } from "../reducers/selectors.js"
import * as O from "effect/Option"
import { constVoid } from "effect/Function"

interface RepoPageProps {
  owner: string
  repo: string
}

export const RepoPage = (props: RepoPageProps) => {
  const dispatch = useAppDispatch()
  const { owner, repo } = props

  /**
   * TODO: select this data from store
   */
  const stargazers: User[] = []

  const selectedRepo = useAppSelector((_) => selectRepo(_, owner, repo))

  //componentWillMount() {
  //  this.props.loadRepoPage(this.props.fullName)
  //}

  useEffect(() => {
    return () => {
      dispatch(Actions.LOAD_REPO_PAGE({ owner, repo }))
    }
  }, [dispatch, owner, repo])

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

  const renderUser = (user: User) => <UserView user={user} key={user.id} />

  if (O.isNone(selectedRepo)) {
    return (
      <h1>
        <i>
          Loading {owner}/{repo} details...
        </i>
      </h1>
    )
  }

  /**
   * TODO: implement
   */
  const onLoadMoreClick = constVoid

  return (
    <div>
      <RepoView repo={selectedRepo.value} />
      <hr />
      <ListView
        renderItem={renderUser}
        items={stargazers}
        onLoadMoreClick={onLoadMoreClick}
        loadingLabel={`Loading stargazers of ${name}...`}
        nextPageUrl="This is a poor prop idea"
      />
    </div>
  )
}

// function mapStateToProps(state) {
// 	const { login, name } = state.router.params
// 	const {
// 		pagination: { stargazersByRepo },
// 		entities: { users, repos },
// 	} = state
//
// 	const fullName = `${login}/${name}`
// 	const stargazersPagination = stargazersByRepo[fullName] || { ids: [] }
// 	const stargazers = stargazersPagination.ids.map((id) => users[id])
//
// 	var userid = findKey(users, (user) => {
// 		return user.login === login
// 	})
//
// 	var repoid = findKey(repos, (repo) => {
// 		return repo.fullName === fullName
// 	})
//
// 	return {
// 		fullName,
// 		name,
// 		stargazers,
// 		stargazersPagination,
// 		repo: repos[repoid],
// 		owner: users[userid],
// 	}
// }
//
// export default connect(mapStateToProps, {
// 	loadRepoPage,
// 	loadMoreStargazers,
// })(RepoPage)
//
