import React, { useCallback, useEffect, useMemo } from "react"
import { ExploreView } from "../components/ExploreView.js"
import { useAppDispatch, useAppSelector } from "../store/hooks.js"
import { useLocation, useParams } from "react-router"
import { selectErrorMessage } from "../reducers/selectors.js"
import * as O from "effect/Option"
import { pipe } from "effect"

interface AppProps {
  // injected by React Redux
  inputValue: string
  navigate: (nextValue: string) => void
  // injected by react router
  children: React.ReactNode
}

export const App = (props: AppProps) => {
  const { children, inputValue } = props
  const dispatch = useAppDispatch()
  const location = useLocation()
  const params = useParams()
  const errorMessage = useAppSelector(selectErrorMessage)

  useEffect(() => {
    return () => {
      // TODO: integrate `wouter`
      // dispatch(
      //   UPDATE_ROUTER_STATE({
      //     pathname: location.pathname,
      //     params,
      //   }),
      // )
    }
  }, [dispatch, location.pathname, params])

  useEffect(() => {
    return () => {
      // TOOD: integrate `wouter`
      // dispatch(
      //   UPDATE_ROUTER_STATE({
      //     pathname: location.pathname,
      //     params: params,
      //   }),
      // )
    }
  }, [dispatch, location.pathname, params])

  const handleDismissClick: React.MouseEventHandler<HTMLAnchorElement> =
    useCallback((e) => {
      // props.resetErrorMessage()
      e.preventDefault()
    }, [])

  const handleChange = useCallback(
    (nextValue: string) => props.navigate(`/${nextValue}`),
    [props],
  )

  const renderErrorMessage = useCallback(
    (message: string) => (
      <p style={{ backgroundColor: "#e99", padding: 10 }}>
        <b>{message}</b> (
        <a href="#" onClick={handleDismissClick}>
          Dismiss
        </a>
        )
      </p>
    ),
    [handleDismissClick],
  )

  const errorMessageView = useMemo(
    () => pipe(errorMessage, O.map(renderErrorMessage), O.getOrNull),
    [errorMessage, renderErrorMessage],
  )

  return (
    <div>
      <ExploreView value={inputValue} onChange={handleChange} />
      <hr />
      {errorMessageView}
      {children}
    </div>
  )
}
