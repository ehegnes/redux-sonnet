import { Route, Switch } from "wouter"
import { App } from "./App.jsx"
import { UserPage } from "./UserPage.jsx"
import { RepoPage } from "./RepoPage.jsx"

export const Root = () => (
  <>
    <App />

    {/* 
      Routes below are matched exclusively -
      the first matched route gets rendered
    */}
    <Switch>
      <Route path="/:owner" nest>
        {(params) => <UserPage owner={params.owner} />}
      </Route>

      <Route path="/:owner/:repo" nest>
        {(params) => <RepoPage owner={params.owner} repo={params.repo} />}
      </Route>

      <Route>Search to see results.</Route>
    </Switch>
  </>
)