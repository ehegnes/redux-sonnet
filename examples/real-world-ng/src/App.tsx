import "./App.css"
import { useDispatch } from "react-redux"

const App = () => {
  const dispatch = useDispatch()

  return (
    <>
      hello world
      <button
        onClick={() => {
          // TODO: integrate `wouter`
          // dispatch(LOAD_USER_PAGE({ login: "ehegnes", requiredFields: [] }))
        }}
      >
        load
      </button>
    </>
  )
}

export default App
