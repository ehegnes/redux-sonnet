import { Action, type Selector } from "@reduxjs/toolkit"
import { Effect, Fiber, flow, Option, pipe, Stream } from "effect"
import { all, call, fork, put, select, take } from "redux-saga/effects"
import { Operators, Stanza } from "redux-sonnet/src"
import type { Actions } from "redux-sonnet/src"
import * as actions from "../actions"
import {
  getRepo,
  getStargazersByRepo,
  getStarredByUser,
  getUser
} from "../reducers/selectors"

// each entity defines 3 creators { request, success, failure }
const { REPO, STARGAZERS, STARRED, USER } = actions

// // url for first page
// // urls for next pages will be extracted from the successive loadMore* requests
// const firstPageStarredUrl = (login: string) => `users/${login}/starred`
// const firstPageStargazersUrl = (fullName: string) => `repos/${fullName}/stargazers`
//
// /***************************** Subroutines ************************************/
//
// // reusable fetch Subroutine
// // entity :  user | repo | starred | stargazers
// // apiFn  : api.fetchUser | api.fetchRepo | ...
// // id     : login | fullName
// // url    : next page url. If not provided will use pass id to apiFn
// function* fetchEntity(entity, apiFn, id, url) {
//   yield put(entity.request(id))
//   const { response, error } = yield call(apiFn, url || id)
//   if (response) yield put(entity.success(id, response))
//   else yield put(entity.failure(id, error))
// }

const fetchEntity = <
  Fulfilled,
  Rejected,
  E,
  R,
  Entity extends Actions.AsyncActionSet<string, Fulfilled>
>(
  entity: Entity,
  apiFn: (url: string) => Effect.Effect<Fulfilled, E, R>,
  id: string,
  url: any
) =>
  Effect.gen(function*() {
    yield* Operators.put(entity.trigger(id))

    const result = yield* pipe(
      apiFn(url),
      Effect.match({
        onFailure: entity.rejected,
        onSuccess: (x) => entity.fulfilled(x)
      })
    )

    return yield* Operators.put(result)
  })

// // yeah! we can also bind Generators
// export const fetchUser = fetchEntity.bind(null, user, api.fetchUser)
const fetchUser = fetchEntity.bind(null, USER, api.fetchUser)
// export const fetchRepo = fetchEntity.bind(null, repo, api.fetchRepo)
const fetchRepo = fetchEntity.bind(null, REPO, api.fetchRepo)
// export const fetchStarred = fetchEntity.bind(null, starred, api.fetchStarred)
const fetchStarred = fetchEntity.bind(null, STARRED, api.fetchStarred)
// export const fetchStargazers = fetchEntity.bind(null, stargazers, api.fetchStargazers)
const fetchStargazers = fetchEntity.bind(null, STARGAZERS, api.fetchStargazers)
//
// // load user unless it is cached
// function* loadUser(login, requiredFields) {
//   const user = yield select(getUser, login)
//   if (!user || requiredFields.some((key) => !user.hasOwnProperty(key))) {
//     yield call(fetchUser, login)
//   }
// }

const loadUser = (login: string) =>
  Effect.gen(function*() {
    const user = yield* Operators.select(getUser, login)

    yield* Option.match(user, {
      onNone: () => fetchUser(login, null),
      onSome: () => Effect.void
    })
  })

// // load repo unless it is cached
// function* loadRepo(fullName, requiredFields) {
//   const repo = yield select(getRepo, fullName)
//   if (!repo || requiredFields.some((key) => !repo.hasOwnProperty(key))) yield call(fetchRepo, fullName)
// }
//
// // load next page of repos starred by this user unless it is cached
// function* loadStarred(login, loadMore) {
//   const starredByUser = yield select(getStarredByUser, login)
//   if (!starredByUser || !starredByUser.pageCount || loadMore)
//     yield call(fetchStarred, login, starredByUser.nextPageUrl || firstPageStarredUrl(login))
// }
const loadStarred = Effect.gen(function*() {
  const starredByUser = yield* Operators.select(getStarredByUser)
})
//
// // load next page of users who starred this repo unless it is cached
// function* loadStargazers(fullName, loadMore) {
//   const stargazersByRepo = yield select(getStargazersByRepo, fullName)
//   if (!stargazersByRepo || !stargazersByRepo.pageCount || loadMore)
//     yield call(fetchStargazers, fullName, stargazersByRepo.nextPageUrl || firstPageStargazersUrl(fullName))
// }

/******************************************************************************/
/******************************* WATCHERS *************************************/
/******************************************************************************/

// // trigger router navigation via history
// function* watchNavigate() {
//   while (true) {
//     const { pathname } = yield take(actions.NAVIGATE)
//     yield history.push(pathname)
//   }
// }

const watchNavigate$ = Stanza.make((action$) =>
  action$.pipe(
    Stream.filter(actions.NAVIGATE.match),
    Stream.map((x) => x.payload.pathname),
    Stream.mapEffect((url) =>
      Effect.sync(() => window.history.pushState(undefined, "", url))
    ),
    // XXX: is this right? can I use void?
  )
)

// // Fetches data for a User : user data + starred repos
// function* watchLoadUserPage() {
//   while (true) {
//     const { login, requiredFields = [] } = yield take(actions.LOAD_USER_PAGE)
//
//     yield fork(loadUser, login, requiredFields)
//     yield fork(loadStarred, login)
//
//   }
// }

const watchLoadUserPage$ = Stanza.make((action$) =>
  action$.pipe(
    Stream.filter(actions.LOAD_USER_PAGE.match),
    Stream.mapEffect(({ payload: { login, requiredFields } }) =>
      Effect.forkAll([
        api.fetchUser(login).pipe(
          Effect.map(USER.fulfilled),
          Effect.catchAll((x) => Effect.succeed(USER.rejected(x)))
        ),
        api.fetchStarred(login).pipe(
          Effect.map(STARRED.fulfilled),
          Effect.catchAll(flow(STARRED.rejected, Effect.succeed))
        )
      ])
    ),
    Stream.mapEffect(Fiber.join),
    Stream.flattenIterables
  )
)

// // Fetches data for a Repo: repo data + repo stargazers
// function* watchLoadRepoPage() {
//   while (true) {
//     const { fullName, requiredFields = [] } = yield take(actions.LOAD_REPO_PAGE)
//
//     yield fork(loadRepo, fullName, requiredFields)
//     yield fork(loadStargazers, fullName)
//   }
// }
//
// // Fetches more starred repos, use pagination data from getStarredByUser(login)
// function* watchLoadMoreStarred() {
//   while (true) {
//     const { login } = yield take(actions.LOAD_MORE_STARRED)
//     yield fork(loadStarred, login, true)
//   }
// }
//
// function* watchLoadMoreStargazers() {
//   while (true) {
//     const { fullName } = yield take(actions.LOAD_MORE_STARGAZERS)
//     yield fork(loadStargazers, fullName, true)
//   }
// }

export const sonnet = {
  watchNavigate$,
  watchLoadUserPage$
}

// export default function* root() {
//   yield all([
//     fork(watchNavigate),
//     fork(watchLoadUserPage),
//     fork(watchLoadRepoPage),
//     fork(watchLoadMoreStarred),
//     fork(watchLoadMoreStargazers),
//   ])
// }
