import { Action } from "@reduxjs/toolkit"
import { Effect, Tuple as T, Option, pipe, Stream } from "effect"
import { Operators, Stanza } from "redux-sonnet"
import { Actions } from "redux-sonnet"
import {
  REPO,
  STARGAZERS,
  STARRED,
  USER,
  NAVIGATE,
  LOAD_USER_PAGE,
} from "./actions.js"
import {
  getRepo,
  getStargazersByRepo,
  getStarredByUser,
  selectUser,
} from "./reducers/selectors.js"
import * as api from "./services/api.js"

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
  E,
  R,
  Entity extends Actions.AsyncActionSet<string, string>,
>(
  entity: Entity,
  apiFn: (url: string) => Effect.Effect<Fulfilled, E, R>,
  id: string,
  url: string,
) =>
  Effect.gen(function* () {
    yield* Operators.put(entity.trigger(id))

    const result = yield* pipe(
      apiFn(url),
      Effect.match({
        onFailure: entity.rejected,
        onSuccess: (x) => entity.fulfilled(x),
      }),
    )

    return yield* Operators.put(result)
  })

export const fetchUser = fetchEntity.bind(null, USER, api.fetchUser)

// // load user unless it is cached
// function* loadUser(login, requiredFields) {
//   const user = yield select(getUser, login)
//   if (!user || requiredFields.some((key) => !user.hasOwnProperty(key))) {
//     yield call(fetchUser, login)
//   }
// }

const loadUser = (login: string) =>
  Effect.gen(function* () {
    const user = yield* Operators.select(selectUser, login)

    const fetchUser = Effect.gen(function* () {
      yield* Operators.put(USER.trigger(login))

      const result = yield* pipe(api.fetchUser(login), Actions.match(USER))

      return yield* Operators.put(result)
    })

    yield* Option.match(user, {
      onNone: () => fetchUser,
      onSome: () => Effect.void,
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

declare const starredByUser: Option.Option<unknown>

const loadStarred = (login: string, page: number | undefined = 1) =>
  Effect.gen(function* () {
    // const starredByUser = yield* Operators.select(selectStarredByUser, login)
    yield* Operators.put(STARRED.trigger(login))

    const starred = pipe(
      api.fetchStarred$(login),
      Stream.take(page),
      Stream.runLast,
      Effect.flatten,
      Effect.map((x) => [x]),
    )

    const result = Actions.match(starred, STARRED)

    return yield* Operators.put(result)
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
    Stream.filter(NAVIGATE.match),
    Stream.map((x) => x.payload.pathname),
    Stream.mapEffect((url) =>
      Effect.sync(() => window.history.pushState(undefined, "", url)),
    ),
    /// XXX: use void; make redux-sonnet filter these for side-effect-only streams
    Stream.map((x) => x as unknown as Action),
  ),
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

const watchLoadUserPage = Effect.gen(function* () {
  const login = yield* pipe(
    Operators.unsafeTake(LOAD_USER_PAGE.match),
    Effect.map((x) => x.payload),
  )

  yield* Effect.fork(loadUser(login))
  yield* Effect.fork(loadStarred(login))
}).pipe(Effect.forever)

// const watchLoadUserPage = Stanza.make((action$) =>
//   action$.pipe(
//     Stream.filter(LOAD_USER_PAGE.match),
//     Stream.mapEffect(({ payload: { login, requiredFields } }) =>
//       Effect.forkAll([
//         api.fetchUser(login).pipe(
//           Effect.map(USER.fulfilled),
//           Effect.catchAll((x) => Effect.succeed(USER.rejected(x)))
//         ),
//         api.fetchStarred(login).pipe(
//           Effect.map(STARRED.fulfilled),
//           Effect.catchAll(flow(STARRED.rejected, Effect.succeed))
//         )
//       ])
//     ),
//     Stream.mapEffect(Fiber.join),
//     Stream.flattenIterables
//   )
// )

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

export const rootStanza = Effect.all(
  {
    watchNavigate$,
    watchLoadUserPage,
  },
  {
    discard: true,
    concurrency: "unbounded",
  },
)

// export default function* root() {
//   yield all([
//     fork(watchNavigate),
//     fork(watchLoadUserPage),
//     fork(watchLoadRepoPage),
//     fork(watchLoadMoreStarred),
//     fork(watchLoadMoreStargazers),
//   ])
// }
