import { Provider as ReduxProvider } from 'react-redux'
import { Route, Router, RouterProvider, createRoutesFromElements } from 'react-router-dom'
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import UserPage from './UserPage';
import RepoPage from './RepoPage';

interface RootProps {
	store: object;
	history: object;
	routes: Router;
	type: string;
	renderProps: any;
}

const router = createBrowserRouter([
	{
		path: '/',
		Component: App,
	},
	{
		path: '/:login',
		Component: UserPage,
	},
	{
		path: '/:login/:name',
		Component: RepoPage,
	},
]);

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
