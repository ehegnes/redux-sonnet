import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createStore } from './store/store.js'
import { Provider } from 'react-redux'
import { Effect, Scope } from 'effect'
import App from './App.tsx'
import './index.css'

const container = document.getElementById('root');

// XXX: middleware needs to live forever (?)
const topLevelScope = Effect.runSync(Scope.make())

const store = Effect.runSync(createStore({}).pipe(Scope.extend(topLevelScope)))

if (container) {
	const root = createRoot(container)

	root.render(
		<StrictMode>
			<Provider store={store}>
				<App />
			</Provider>
		</StrictMode>,
	)
}
