import React from 'react'
import * as Actions from '../actions/index.js'
import { Explore } from '../components/Explore'
import { useAppDispatch } from '../store/hooks.js';
import { useLocation, useParams } from 'react-router';
import { useSelector } from 'react-redux';
import { selectErrorMessage } from '../reducers/selectors.js';
import * as O from 'effect/Option'

interface AppProps {
	// injected by React Redux
	inputValue: string;
	navigate: (nextValue: string) => void;
	// injected by react router
	children: React.ReactNode;
}

const App = (props: AppProps) => {
	const dispatch = useAppDispatch()
	const location = useLocation()
	const params = useParams();
	const errorMessage = useSelector(selectErrorMessage)

	React.useEffect(() => {
		return () => dispatch(
			Actions.UPDATE_ROUTER_STATE({
				pathname: location.pathname,
				params,
			})
		)
	}, [location.pathname, params])

	React.useEffect(() => {
		return () => dispatch(Actions.UPDATE_ROUTER_STATE({
			pathname: location.pathname,
			params: params,
		}))
	}, [location.pathname, params])

	const handleDismissClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
		props.resetErrorMessage()
		e.preventDefault()
	}

	const handleChange = React.useCallback(
		(nextValue: string) => props.navigate(`/${nextValue}`),
		[]
	)

	const errorMessageView = React.useMemo(() => {
		return O.match(errorMessage, {
			onNone: () => null,
			onSome: (message) => (
				<p style={{ backgroundColor: '#e99', padding: 10 }}>
					<b>{message}</b> (
					<a href="#" onClick={handleDismissClick}>
						Dismiss
					</a>
					)
				</p>
			)
		})
	}, [])

	const { children, inputValue } = props

	return (
		<div>
			<Explore
				value={inputValue}
				onChange={handleChange}
			/>
			<hr />
			{errorMessage}
			{children}
		</div>
	)
}

