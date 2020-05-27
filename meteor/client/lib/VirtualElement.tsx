import * as React from 'react'
import InView, { useInView } from 'react-intersection-observer'

export interface IProps {
	initialShow?: boolean
	placeholderHeight?: number
	debug?: boolean
	placeholderClassName?: string
	width?: string | number
	margin?: string
	id?: string | undefined
}

declare global {
	interface Window {
		requestIdleCallback(
			callback: Function,
			options?: {
				timeout: number
			}
		): number
		cancelIdleCallback(callback: number)
	}
}

interface IState {
	inView: boolean
	isMeasured: boolean

	width: string | number
	clientHeight: number
	marginLeft: string | number | undefined
	marginRight: string | number | undefined
	marginTop: string | number | undefined
	marginBottom: string | number | undefined
	id: string | undefined
}

const OPTIMIZE_PERIOD = 5000
const IN_VIEW_GRACE_PERIOD = 500

export class VirtualElement extends React.Component<IProps, IState> {
	private el: HTMLElement | null = null
	private instance: HTMLElement | null = null
	private optimizeTimeout: NodeJS.Timer | null = null
	private refreshSizingTimeout: NodeJS.Timer | null = null
	private styleObj: CSSStyleDeclaration | undefined

	constructor(props: IProps) {
		super(props)
		this.state = {
			inView: props.initialShow || false,
			isMeasured: false,
			clientHeight: 0,
			width: 'auto',
			marginBottom: undefined,
			marginTop: undefined,
			marginLeft: undefined,
			marginRight: undefined,
			id: undefined,
		}
	}

	visibleChanged = (inView: boolean) => {
		this.props.debug && console.log(this.props.id, 'Changed', inView)
		if (this.optimizeTimeout) {
			clearTimeout(this.optimizeTimeout)
			this.optimizeTimeout = null
		}
		if (inView && !this.state.inView) {
			this.setState({
				inView,
			})
		} else if (!inView && this.state.inView) {
			this.optimizeTimeout = setTimeout(() => {
				this.optimizeTimeout = null
				this.setState({
					inView,
				})
			}, OPTIMIZE_PERIOD)
		}
	}

	refreshSizing = () => {
		this.refreshSizingTimeout = null
		if (this.el) {
			const style = this.styleObj || window.getComputedStyle(this.el)
			this.styleObj = style
			this.setState({
				isMeasured: true,
				width: style.width || 'auto',
				clientHeight: this.el.clientHeight,
				marginTop: style.marginTop || undefined,
				marginBottom: style.marginBottom || undefined,
				marginLeft: style.marginLeft || undefined,
				marginRight: style.marginRight || undefined,
				id: this.el.id,
			})
			this.props.debug && console.log(this.props.id, 'Re-measuring child', this.el.clientHeight)
		}
	}

	findChildElement = () => {
		if (!this.el || !this.el.parentElement) {
			const el = this.instance ? (this.instance.firstElementChild as HTMLElement) : null
			if (el && !el.classList.contains('virtual-element-placeholder')) {
				this.el = el
				this.styleObj = undefined
				this.refreshSizingTimeout = setTimeout(this.refreshSizing, 250)
			}
		}
	}

	setRef = (instance: HTMLElement | null) => {
		this.instance = instance
		this.findChildElement()
	}

	componentDidUpdate(prevProps, prevState: IState) {
		if (this.state.inView && prevState.inView !== this.state.inView) {
			// console.log('Find actual child')
			this.findChildElement()
		}
	}

	UNSAFE_componentWillUpdate(newProps, newState: IState) {
		if (this.state.inView && !newState.inView) {
			this.props.debug && console.log(this.props.id, 'Item is going away from viewport, refreshSizing')
			this.refreshSizing()
		}
	}

	componentWillUnmount() {
		if (this.optimizeTimeout) clearTimeout(this.optimizeTimeout)
		if (this.refreshSizingTimeout) clearTimeout(this.refreshSizingTimeout)
	}

	render() {
		this.props.debug &&
			console.log(
				this.props.id,
				this.state.inView,
				this.props.initialShow,
				this.state.isMeasured,
				!this.state.inView && (!this.props.initialShow || this.state.isMeasured)
			)
		return (
			<InView threshold={0} rootMargin={this.props.margin || '50% 0px 50% 0px'} onChange={this.visibleChanged}>
				<div ref={this.setRef}>
					{!this.state.inView && (!this.props.initialShow || this.state.isMeasured) ? (
						<div
							id={this.state.id || this.props.id}
							className={'virtual-element-placeholder ' + (this.props.placeholderClassName || '')}
							style={{
								width: this.props.width || this.state.width,
								height: (this.state.clientHeight || this.props.placeholderHeight || '0') + 'px',
								marginTop: this.state.marginTop,
								marginLeft: this.state.marginLeft,
								marginRight: this.state.marginRight,
								marginBottom: this.state.marginBottom,
							}}></div>
					) : (
						this.props.children
					)}
				</div>
			</InView>
		)
	}
}
