import * as _ from 'underscore'
import * as React from 'react'

import Lottie from 'react-lottie'

interface IProps {
	inAnimation?: any
	outAnimation?: any
	className?: string
	onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
	onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void
	onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void
}

interface IState {
	hover: boolean
}

export class LottieButton extends React.Component<IProps, IState> {
	base: object = {
		loop: false,
		autoplay: true,
		animationData: {},
		rendererSettings: {
			preserveAspectRatio: 'xMidYMid meet',
		},
	}

	overAnimation: object | undefined
	outAnimation: object | undefined

	constructor(props: IProps) {
		super(props)

		this.state = {
			hover: false,
		}

		this.buildAnimationObjects(props)
	}

	onClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (this.props.onClick && typeof this.props.onClick === 'function') {
			this.props.onClick(e)
		}
	}

	onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
		this.setState({
			hover: true,
		})
	}

	onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
		this.setState({
			hover: false,
		})
	}

	buildAnimationObjects(props: IProps) {
		this.overAnimation = _.extend(_.clone(this.base), {
			animationData: props.inAnimation,
		})
		this.outAnimation = _.extend(_.clone(this.base), {
			animationData: props.outAnimation,
		})
	}

	render() {
		return (
			<div
				className={this.props.className}
				role="button"
				style={{ position: 'relative' }}
				onClick={this.onClick}
				tabIndex={0}>
				<Lottie
					options={this.state.hover ? this.overAnimation : this.outAnimation}
					isStopped={false}
					isPaused={false}
				/>
				{this.props.children}
				<div
					style={{ position: 'absolute', top: '0', left: '0', right: '0', bottom: '0' }}
					onMouseEnter={this.onMouseEnter}
					onMouseLeave={this.onMouseLeave}></div>
			</div>
		)
	}
}
