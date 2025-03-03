import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createStore } from "./store/store.js"
import { Provider as ReduxProvider } from "react-redux"
import "./index.css"
import { Root } from "./containers/Root.jsx"

const container = document.getElementById("root")

const store = createStore()

if (container) {
  const root = createRoot(container)

  root.render(
    <StrictMode>
      <ReduxProvider store={store}>
        <Root />
      </ReduxProvider>
    </StrictMode>,
  )
}
