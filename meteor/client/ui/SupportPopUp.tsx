import * as React from 'react'
import * as ClassNames from 'classnames'
import { withTracker } from '../lib/ReactMeteorData/ReactMeteorData'
import { MeteorReactComponent } from '../lib/MeteorReactComponent'
import { CoreSystem } from '../../lib/collections/CoreSystem'
import * as FontAwesomeIcon from '@fortawesome/react-fontawesome'
import * as faQuestion from '@fortawesome/fontawesome-free-solid/faQuestion'
import { translate, InjectedTranslateProps } from 'react-i18next'
import { getHelpMode } from '../lib/localStorage'

interface IProps {}

interface ITrackedProps {
	support: {
		message: string
	}
	systemInfo: {
		message: string
		enabled: boolean
	}
}

export const SupportPopUp = withTracker<IProps, {}, ITrackedProps>((props: IProps) => {
	const core = CoreSystem.findOne()
	return {
		support: core && core.support ? core.support : { message: '' },
		systemInfo: core && core.systemInfo ? core.systemInfo : { message: '', enabled: false },
	}
})(
	class SupportPopUp extends MeteorReactComponent<IProps & ITrackedProps> {
		constructor(props: IProps) {
			super(props)
		}

		// componentDidMount () {}

		render() {
			return (
				<div className="support-pop-up-panel">
					<div
						dangerouslySetInnerHTML={this.props.support.message ? { __html: this.props.support.message } : undefined}
					/>
					{this.props.children && <div className="support-pop-up-panel__actions">{this.props.children}</div>}
					{!this.props.support.message && <DocumentationLink></DocumentationLink>}
				</div>
			)
		}
	}
)

interface IToggleProps {
	isOpen?: boolean
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export class SupportPopUpToggle extends React.PureComponent<IToggleProps> {
	// getMessages () {
	// 	const core = CoreSystem.findOne()
	// 	if (!core) {
	// 		return ''
	// 	}

	// 	if (!core.support) {
	// 		return ''
	// 	}

	// 	return core.support.message
	// }
	render() {
		return (
			<React.Fragment>
				<button
					className={ClassNames('status-bar__controls__button', 'support__toggle-button', {
						'status-bar__controls__button--open': this.props.isOpen,
						// 'status-bar__controls__button--has-messages': this.getMessages() !== ''
					})}
					role="button"
					onClick={this.props.onClick}
					tabIndex={0}>
					<FontAwesomeIcon icon={faQuestion} />
				</button>
			</React.Fragment>
		)
	}
}

export const DocumentationLink = translate()(
	class DocumentationLink extends React.Component<InjectedTranslateProps> {
		render() {
			const { t } = this.props
			return (
				<p className="mod mhn mbn">
					{getHelpMode() ? (
						<div>
							{t('Disable hints by adding this to the URL:')}&nbsp;
							<a href="?help=0">?help=0</a>
						</div>
					) : (
						<div>
							{t('Enable hints by adding this to the URL:')}&nbsp;
							<a href="?help=1">?help=1</a>
						</div>
					)}
					{t('More documentation available at:')}&nbsp;
					<a href="https://github.com/nrkno/Sofie-TV-automation/">https://github.com/nrkno/Sofie-TV-automation/</a>
				</p>
			)
		}
	}
)
