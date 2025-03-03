import { Provider as ReduxProvider } from "react-redux"
import { Link, Route, Switch } from "wouter"
import App from "../App.jsx"
import { UserPage } from "./UserPage.jsx"
import { RepoPage } from "./RepoPage.jsx"

interface RootProps {
  store: object
  history: object
  routes: Router
  type: string
  renderProps: any
}

const Root = () => (
  <>
    <Link href="/users/1">Profile</Link>

    <Route path="/about">About Us</Route>

    {/* 
      Routes below are matched exclusively -
      the first matched route gets rendered
    */}
    <Switch>
      <Route path="/" component={App} />

      <Route path="/:login">
        {(params) => <UserPage login={params.login}></UserPage>}
      </Route>

      {/* Default route in a switch */}
      <Route>404: No such page!</Route>
    </Switch>
  </>
)
const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/:owner",
    Component: UserPage,
  },
  {
    path: "/:owner/:repo",
    Component: RepoPage,
  },
])

export const Root = (props: RootProps) => {
  const { store, history, routes, type, renderProps } = props

  return (
    <ReduxProvider store={store}>
      <div>
        {/* {type === 'server' ? <RouterContext {...renderProps} /> : <Router history={history} routes={routes} />} */}
        <RouterProvider router={router} />
        {/* <DevTools /> */}
      </div>
    </ReduxProvider>
  )
}
