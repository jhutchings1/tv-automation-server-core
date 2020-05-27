import { Meteor } from 'meteor/meteor'
import * as React from 'react'
import { Translated } from '../lib/ReactMeteorData/react-meteor-data'
import * as _ from 'underscore'
import { translate } from 'react-i18next'

import { Route, Switch, Redirect, Link, NavLink } from 'react-router-dom'
import SystemStatus from './Status/SystemStatus'
import { MediaManagerStatus } from './Status/MediaManager'
import { ExternalMessages } from './Status/ExternalMessages'
import { UserActivity } from './Status/UserActivity'
import { EvaluationView } from './Status/Evaluations'
import { MeteorReactComponent } from '../lib/MeteorReactComponent'
import { PubSub } from '../../lib/api/pubsub'

class WelcomeToStatus extends React.Component {
	render() {
		return <div></div>
	}
}
interface IStatusMenuProps {
	match?: any
}
interface IStatusMenuState {}
const StatusMenu = translate()(
	class StatusMenu extends React.Component<Translated<IStatusMenuProps>, IStatusMenuState> {
		render() {
			const { t } = this.props

			return (
				<div className="tight-xs htight-xs text-s">
					<NavLink
						activeClassName="selectable-selected"
						className="status-menu__status-menu-item selectable clickable"
						to={'/status/system'}>
						<h3>{t('System')}</h3>
					</NavLink>
					<NavLink
						activeClassName="selectable-selected"
						className="status-menu__status-menu-item selectable clickable"
						to={'/status/media'}>
						<h3>{t('Media')}</h3>
					</NavLink>
					<NavLink
						activeClassName="selectable-selected"
						className="status-menu__status-menu-item selectable clickable"
						to={'/status/messages'}>
						<h3>{t('Messages')}</h3>
					</NavLink>
					<NavLink
						activeClassName="selectable-selected"
						className="status-menu__status-menu-item selectable clickable"
						to={'/status/userLog'}>
						<h3>{t('User Log')}</h3>
					</NavLink>
					<NavLink
						activeClassName="selectable-selected"
						className="status-menu__status-menu-item selectable clickable"
						to={'/status/evaluations'}>
						<h3>{t('Evaluations')}</h3>
					</NavLink>
				</div>
			)
		}
	}
)

interface IStatusProps {
	match?: any
}
class Status extends MeteorReactComponent<Translated<IStatusProps>> {
	componentWillMount() {
		// Subscribe to data:

		this.subscribe(PubSub.peripheralDevices, {})
		this.subscribe(PubSub.studios, {})
		this.subscribe(PubSub.showStyleBases, {})
		this.subscribe(PubSub.showStyleVariants, {})
	}
	render() {
		// const { t } = this.props

		return (
			<div className="mtl gutter has-statusbar">
				{/* <header className='mvs'>
					<h1>{t('Status')}</h1>
				</header> */}
				<div className="mod mvl mhs">
					<div className="flex-row hide-m-up">
						<div className="flex-col c12 rm-c1 status-menu">
							<StatusMenu match={this.props.match} />
						</div>
					</div>
					<div className="flex-row">
						<div className="flex-col c12 rm-c1 show-m-up status-menu">
							<StatusMenu match={this.props.match} />
						</div>
						<div className="flex-col c12 rm-c11 status-dialog">
							<Switch>
								{/* <Route path='/status' exact component={WelcomeToStatus} /> */}
								<Route path="/status/messages" component={ExternalMessages} />
								<Route path="/status/media" component={MediaManagerStatus} />
								<Route path="/status/system" component={SystemStatus} />
								<Route path="/status/userLog" component={UserActivity} />
								<Route path="/status/evaluations" component={EvaluationView} />
								<Redirect to="/status/system" />
							</Switch>
						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default translate()(Status)
