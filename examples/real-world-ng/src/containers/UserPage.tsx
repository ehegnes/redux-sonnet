import React, { Component, useCallback, useEffect } from "react"
import PropTypes from "prop-types"
import { connect, useSelector } from "react-redux"
import { loadUserPage, loadMoreStarred } from "../actions"
import { UserView } from "../components/UserView.js"
import { RepoView } from "../components/RepoView.js"
import { ListView } from "../components/ListView.js"
import { useLocation, useRoute } from "wouter"
import { LOAD_MORE_STARRED, LOAD_USER_PAGE } from "../actions.js"
import { useAppDispatch, useAppSelector } from "../store/hooks.js"
import { selectUser } from "../reducers/selectors.js"
import * as O from "effect/Option"
import * as I from "effect/Iterable"
import * as A from "effect/Array"
import { Repo, User } from "../models.js"

// UserPage.propTypes = {
//   user: PropTypes.object,
//   starredPagination: PropTypes.object,
//   starredRepos: PropTypes.array.isRequired,
//   starredRepoOwners: PropTypes.array.isRequired,
//   loadUserPage: PropTypes.func.isRequired,
//   loadMoreStarred: PropTypes.func.isRequired,
// }

interface UserPageProps {
  owner: string
}

export const UserPage = (props: UserPageProps) => {
  const { owner } = props
  const dispatch = useAppDispatch()
  const user = useAppSelector((_) => selectUser(_, owner))
  /**
   * TODO: implement selector
   */
  const starredRepos: Repo[] = []

  useEffect(() => {
    dispatch(LOAD_USER_PAGE(owner))
  }, [dispatch, owner])

  const renderRepo = (repo: Repo) => <RepoView repo={repo} />

  const handleLoadMoreClick = useCallback(() => {
    dispatch(LOAD_MORE_STARRED(owner))
  }, [dispatch, owner])

  return O.match(user, {
    onNone: () => (
      <h1>
        <i>Loading {owner}'s profile...</i>
      </h1>
    ),
    onSome: (user) => (
      <div>
        <UserView user={user} />
        <hr />
        <ListView
          renderItem={renderRepo}
          items={starredRepos}
          onLoadMoreClick={handleLoadMoreClick}
          loadingLabel={`Loading ${owner}'s starred...`}
          nextPageUrl="TODO: this should not exist"
          isFetching={false} // TODO: hook up to trigger action
          pageCount={0} // TODO: whew
        />
      </div>
    ),
  })
}

// function mapStateToProps(state) {
// const { login } = state.router.params
// const {
// pagination: { starredByUser },
// entities: { users, repos },
// } = state

// const starredPagination = starredByUser[login] || { ids: [] }
// const starredRepos = starredPagination.ids.map((id) => repos[id])
// const starredRepoOwners = starredRepos.map((repo) => users[repo.owner])

// const userid = findKey(users, (user) => {
// return user.login === login
// })

// return {
// login,
// starredRepos,
// starredRepoOwners,
// starredPagination,
// user: users[userid],
// }
// }

// export default connect(mapStateToProps, {
//   loadUserPage,
//   loadMoreStarred,
// })(UserPage)
