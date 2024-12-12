import { useCallback, useState } from 'react'
const GITHUB_REPO = 'https://github.com/reduxjs/redux'

interface ExploreProps {
	value: string;
	onChange: (value: string) => void;
}

export const Explore = (props: ExploreProps) => {
	const [value, setValue] = useState(props.value)
	const { onChange } = props;

	const handleChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
		setValue(e.currentTarget.value)
	}, [setValue])

	const handleGoClick = useCallback(() => {
		onChange(value)
	}, [onChange, value])

	const handleKeyUp: React.KeyboardEventHandler<HTMLInputElement> = useCallback((e) => {
		if (e.key === 'Enter') {
			handleGoClick()
		}
	}, [handleGoClick])

	return (
		<div>
			<p>Type a username or repo full name and hit 'Go':</p>
			<input
				size={45}
				defaultValue={props.value}
				onChange={handleChange}
				onKeyUp={handleKeyUp}
			/>
			<button onClick={handleGoClick}>Go!</button>
			<p>
				Code on{' '}
				<a href={GITHUB_REPO} target="_blank">
					Github
				</a>
				.
			</p>
			<p>Move the DevTools with Ctrl+W or hide them with Ctrl+H.</p>
		</div>
	)
}
