import React, { useCallback, useEffect, useMemo, useState } from "react"
import { ExploreView } from "../components/ExploreView.js"
import { useAppDispatch, useAppSelector } from "../store/hooks.js"
import { selectErrorMessage } from "../reducers/selectors.js"
import * as O from "effect/Option"
import { pipe } from "effect"
import { navigate } from "wouter/use-browser-location";
import { useLocation, useParams } from "wouter"

export const App = () => {
  const [input, setInput] = useState("")
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
  }, [dispatch, location, params])

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
  }, [dispatch, location, params])

  const handleDismissClick: React.MouseEventHandler<HTMLAnchorElement> =
    useCallback((e) => {
      // props.resetErrorMessage()
      e.preventDefault()
    }, [])

  const handleChange = useCallback((nextValue: string) =>
    navigate(`/${nextValue}`),
    [],
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
      <ExploreView value={input} onChange={setInput} />
      <hr />
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {errorMessageView}
      </pre>
    </div>
  )
}
