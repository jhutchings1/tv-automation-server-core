import { Meteor } from 'meteor/meteor'
import * as React from 'react'
import * as _ from 'underscore'
import { Translated, translateWithTracker } from '../lib/ReactMeteorData/react-meteor-data'
import { Link } from 'react-router-dom'
const Tooltip = require('rc-tooltip')
import timer from 'react-timer-hoc'
import { Rundown, Rundowns } from '../../lib/collections/Rundowns'
import { RundownPlaylist, RundownPlaylists } from '../../lib/collections/RundownPlaylists'
import Moment from 'react-moment'
import { RundownUtils } from '../lib/rundown'
import { getCurrentTime, literal } from '../../lib/lib'
import { MomentFromNow } from '../lib/Moment'
import * as faTrash from '@fortawesome/fontawesome-free-solid/faTrash'
import * as faSync from '@fortawesome/fontawesome-free-solid/faSync'
import * as FontAwesomeIcon from '@fortawesome/react-fontawesome'
import { MeteorReactComponent } from '../lib/MeteorReactComponent'
import { ModalDialog, doModalDialog } from '../lib/ModalDialog'
import { SystemStatusAPI, StatusResponse } from '../../lib/api/systemStatus'
import { ManualPlayout } from './manualPlayout'
import { getAllowDeveloper, getAllowConfigure, getAllowService, getHelpMode } from '../lib/localStorage'
import { doUserAction } from '../lib/userAction'
import { UserActionAPI } from '../../lib/api/userActions'
import { getCoreSystem, ICoreSystem, GENESIS_SYSTEM_VERSION, CoreSystem } from '../../lib/collections/CoreSystem'
import { NotificationCenter, Notification, NoticeLevel, NotificationAction } from '../lib/notifications/notifications'
import { Studios } from '../../lib/collections/Studios'
import { ShowStyleBases } from '../../lib/collections/ShowStyleBases'
import { ShowStyleVariants } from '../../lib/collections/ShowStyleVariants'
import { PubSub } from '../../lib/api/pubsub'
import { ReactNotification } from '../lib/notifications/ReactNotification'
import { Spinner } from '../lib/Spinner'

const PackageInfo = require('../../package.json')

interface RundownPlaylistUi extends RundownPlaylist {
	rundownStatus: string
	rundownAirStatus: string
	unsyncedRundowns: Rundown[]
	studioName: string
	showStyles: Array<{ id: string, baseName: string, variantName: string }>
}

interface IRundownListItemProps {
	key: string,
	rundownPlaylist: RundownPlaylistUi
}

interface IRundownListItemStats {
}

export class RundownListItem extends React.Component<Translated<IRundownListItemProps>, IRundownListItemStats> {
	constructor (props) {
		super(props)
	}

	getRundownPlaylistLink (rundownPlaylistId: string) {
		// double encoding so that "/" are handled correctly
		return '/rundown/' + encodeURIComponent(encodeURIComponent(rundownPlaylistId))
	}
	getStudioLink (studioId: string) {
		// double encoding so that "/" are handled correctly
		return '/settings/studio/' + encodeURIComponent(encodeURIComponent(studioId))
	}
	getshowStyleBaseLink (showStyleBaseId: string) {
		// double encoding so that "/" are handled correctly
		return '/settings/showStyleBase/' + encodeURIComponent(encodeURIComponent(showStyleBaseId))
	}

	confirmDeleteRundownPlaylist (rundownPlaylist: RundownPlaylist) {
		const { t } = this.props

		doModalDialog({
			title: t('Delete this RundownPlaylist?'),
			yes: t('Delete'),
			no: t('Cancel'),
			onAccept: (e) => {
				doUserAction(t, e, UserActionAPI.methods.removeRundownPlaylist, [rundownPlaylist._id])
			},
			message: (
				t('Are you sure you want to delete the "{{name}}" RundownPlaylist?', { name: rundownPlaylist.name }) + '\n' +
				t('Please note: This action is irreversible!')
			)
		})
	}

	confirmReSyncRundownPlaylist (rundownPlaylist: RundownPlaylist) {
		const { t } = this.props
		doModalDialog({
			title: t('Re-Sync this rundownPlaylist?'),
			yes: t('Re-Sync'),
			no: t('Cancel'),
			onAccept: (e) => {
				doUserAction(t, e, UserActionAPI.methods.resyncRundownPlaylist, [rundownPlaylist._id])
			},
			message: (
				t('Are you sure you want to re-sync all rundowns in playlist "{{name}}"?', { name: rundownPlaylist.name })
			)
		})
	}

	render () {
		const { t } = this.props
		return (
			<React.Fragment>
				<tr className='rundown-list-item'>
					<th className='rundown-list-item__name'>
						{this.props.rundownPlaylist.active ?
							<Tooltip overlay={t('This rundown is currently active')} visible={getHelpMode()} placement='bottom'>
								<div className='origo-pulse small right mrs'>
									<div className='pulse-marker'>
										<div className='pulse-rays'></div>
										<div className='pulse-rays delay'></div>
									</div>
								</div>
							</Tooltip>
							: null
						}
						<Link to={this.getRundownPlaylistLink(this.props.rundownPlaylist._id)}>{this.props.rundownPlaylist.name}</Link>
					</th>
					<td className='rundown-list-item__studio'>
						{
							getAllowConfigure() ?
							<Link to={this.getStudioLink(this.props.rundownPlaylist.studioId)}>{this.props.rundownPlaylist.studioName}</Link> :
							this.props.rundownPlaylist.studioName
						}
					</td>
					<td className='rundown-list-item__showStyle'>
						{
							getAllowConfigure() ?
								(
									this.props.rundownPlaylist.showStyles.length === 1 ?
									<Link to={this.getshowStyleBaseLink(this.props.rundownPlaylist.showStyles[0].id)}>{`${this.props.rundownPlaylist.showStyles[0].baseName} - ${this.props.rundownPlaylist.showStyles[0].variantName}`}</Link> :
									t('Multiple ({{count}})', { count: this.props.rundownPlaylist.showStyles.length })
								) : (
									this.props.rundownPlaylist.showStyles.length === 1 ?
									`${this.props.rundownPlaylist.showStyles[0].baseName} - ${this.props.rundownPlaylist.showStyles[0].variantName}` :
									t('Multiple ({{count}})', { count: this.props.rundownPlaylist.showStyles.length })
								)
						}
					</td>
					<td className='rundown-list-item__created'>
						<MomentFromNow>{this.props.rundownPlaylist.created}</MomentFromNow>
					</td>
					<td className='rundown-list-item__airTime'>
						{this.props.rundownPlaylist.expectedStart &&
							<Moment format='YYYY/MM/DD HH:mm:ss'>{this.props.rundownPlaylist.expectedStart}</Moment>
						}
					</td>
					<td className='rundown-list-item__duration'>
						{this.props.rundownPlaylist.expectedDuration &&
							RundownUtils.formatDiffToTimecode(this.props.rundownPlaylist.expectedDuration, false, false, true, false, true)
						}
					</td>
					<td className='rundown-list-item__status'>
						{this.props.rundownPlaylist.rundownStatus}
					</td>
					<td className='rundown-list-item__air-status'>
						{this.props.rundownPlaylist.rundownAirStatus}
					</td>
					<td className='rundown-list-item__actions'>
						{
							(this.props.rundownPlaylist.unsyncedRundowns.length > 0 || getAllowConfigure() || getAllowService()) ?
							<Tooltip overlay={t('Delete')} placement='top'>
								<button className='action-btn' onClick={(e) => this.confirmDeleteRundownPlaylist(this.props.rundownPlaylist)}>
									<FontAwesomeIcon icon={faTrash} />
								</button>
							</Tooltip> : null
						}
						{
							this.props.rundownPlaylist.unsyncedRundowns.length > 0 ?
							<Tooltip overlay={t('Re-sync all rundowns in playlist')} placement='top'>
								<button className='action-btn' onClick={(e) => this.confirmReSyncRundownPlaylist(this.props.rundownPlaylist)}>
									<FontAwesomeIcon icon={faSync} />
								</button>
							</Tooltip> : null
						}
					</td>
				</tr>
				{this.props.rundownPlaylist.startedPlayback !== undefined && this.props.rundownPlaylist.expectedDuration !== undefined && this.props.rundownPlaylist.active &&
					<tr className='hl expando-addon'>
						<td colSpan={8}>
							<ActiveProgressBar
								rundown={this.props.rundownPlaylist}
							/>
						</td>
					</tr>
				}
			</React.Fragment>
		)
	}
}
interface RundownUI extends Rundown {
	studioName: string
	showStyleBaseName: string
	showStyleVariantName: string
}

enum ToolTipStep {
	TOOLTIP_START_HERE = 'TOOLTIP_START_HERE',
	TOOLTIP_RUN_MIGRATIONS = 'TOOLTIP_RUN_MIGRATIONS',
	TOOLTIP_EXTRAS = 'TOOLTIP_EXTRAS'
}

interface IRundownsListProps {
	coreSystem: ICoreSystem
	rundownPlaylists: Array<RundownPlaylistUi>
}

interface IRundownsListState {
	systemStatus?: StatusResponse
	subsReady: boolean
}

export const RundownList = translateWithTracker((props) => {
	// console.log('PeripheralDevices',PeripheralDevices);
	// console.log('PeripheralDevices.find({}).fetch()',PeripheralDevices.find({}, { sort: { created: -1 } }).fetch());

	const studios = Studios.find().fetch()
	const showStyleBases = ShowStyleBases.find().fetch()
	const showStyleVariants = ShowStyleVariants.find().fetch()

	return {
		coreSystem: getCoreSystem(),
		rundownPlaylists: RundownPlaylists.find({}, { sort: { created: -1 } }).fetch().map((playlist: RundownPlaylistUi) => {
			const rundownsInPlaylist = playlist.getRundowns()
			playlist.rundownAirStatus = rundownsInPlaylist.map(rundown => rundown.airStatus).join(', ')
			playlist.rundownStatus = rundownsInPlaylist.map(rundown => rundown.status).join(', ')
			playlist.unsyncedRundowns = rundownsInPlaylist.filter(rundown => rundown.unsynced)

			const studio = _.find(studios, s => s._id === playlist.studioId)

			playlist.studioName = studio && studio.name || ''
			playlist.showStyles = _.uniq(
				rundownsInPlaylist.map(rundown => [rundown.showStyleBaseId, rundown.showStyleVariantId]), false, (ids) => ids[0] + '_' + ids[1]
				).map(combo => {
					const showStyleBase = _.find(showStyleBases, style => style._id === combo[0])
					const showStyleVariant = _.find(showStyleVariants, variant => variant._id === combo[1])

					return {
						id: showStyleBase && showStyleBase._id || '',
						baseName: showStyleBase && showStyleBase.name || '',
						variantName: showStyleVariant && showStyleVariant.name || ''
					}
				})
			return playlist
		})
	}
})(
class extends MeteorReactComponent<Translated<IRundownsListProps>, IRundownsListState> {
	// private _subscriptions: Array<Meteor.SubscriptionHandle> = []

	constructor (props) {
		super(props)

		this.state = {
			subsReady: false
		}
	}

	tooltipStep () {
		const syncedRundownPlaylists = this.props.rundownPlaylists.filter(rundownPlaylist => rundownPlaylist.unsyncedRundowns.length === 0)
		const unsyncedRundownPlaylists = this.props.rundownPlaylists.filter(rundownPlaylist => rundownPlaylist.unsyncedRundowns.length > 0)

		if (
			this.props.coreSystem &&
			this.props.coreSystem.version === GENESIS_SYSTEM_VERSION &&
			syncedRundownPlaylists.length === 0 &&
			unsyncedRundownPlaylists.length === 0
		) {
			if (getAllowConfigure()) {
				return ToolTipStep.TOOLTIP_RUN_MIGRATIONS
			} else {
				return ToolTipStep.TOOLTIP_START_HERE
			}
		} else {
			return ToolTipStep.TOOLTIP_EXTRAS
		}
	}

	componentDidMount () {
		const { t } = this.props

		// Subscribe to data:
		this.subscribe(PubSub.rundownPlaylists, {})
		this.subscribe(PubSub.studios, {})

		this.autorun(() => {
			const showStyleBaseIds = _.uniq(_.map(Rundowns.find().fetch(), rundown => rundown.showStyleBaseId))
			const showStyleVariantIds = _.uniq(_.map(Rundowns.find().fetch(), rundown => rundown.showStyleVariantId))
			const playlistIds = _.uniq(RundownPlaylists.find().fetch().map(i => i._id))

			this.subscribe(PubSub.showStyleBases, {
				_id: { $in: showStyleBaseIds }
			})
			this.subscribe(PubSub.showStyleVariants, {
				_id: { $in: showStyleVariantIds }
			})
			this.subscribe(PubSub.rundowns, {
				playlistId: { $in: playlistIds }
			})
		})

		this.autorun(() => {
			let subsReady = this.subscriptionsReady()
			if (subsReady !== this.state.subsReady) {
				this.setState({
					subsReady: subsReady
				})
			}
		})

		Meteor.call(SystemStatusAPI.getSystemStatus, (err: any, systemStatus: StatusResponse) => {
			if (err) {
				// console.error(err)
				NotificationCenter.push(new Notification('systemStatus_failed', NoticeLevel.CRITICAL, t('Could not get system status. Please consult system administrator.'), 'RundownList'))
				return
			}

			this.setState({
				systemStatus: systemStatus
			})
		})
	}

	registerHelp (core: ICoreSystem) {
		const { t } = this.props

		const step = this.tooltipStep()

		return <React.Fragment>
			{ step === ToolTipStep.TOOLTIP_START_HERE ?
				<ReactNotification actions={[
					literal<NotificationAction>({
						label: 'Enable',
						action: () => {
							window.location.assign('/?configure=1')
						},
						type: 'button'
					})
				]}>{t('Enable configuration mode by adding ?configure=1 to the address bar.')}</ReactNotification>
				: undefined
			}
			{ step === ToolTipStep.TOOLTIP_START_HERE || step === ToolTipStep.TOOLTIP_RUN_MIGRATIONS ?
				<ReactNotification actions={[
					literal<NotificationAction>({
						label: 'Go to migrations',
						action: () => {
							window.location.assign('/settings/tools/migration')
						},
						type: 'button'
					})
				]}>{t('You need to run migrations to set the system up for operation.')}</ReactNotification>
				: undefined
			}
			{/* !this.props.rundowns.length ?
				<ReactNotification>{t('Add rundowns by connecting a gateway.')}</ReactNotification>
				: undefined
			*/}
			{/* this.state.systemStatus && this.state.systemStatus.status === 'FAIL' ?
				<ReactNotification>{t('Check system status messages.')}</ReactNotification>
				: undefined
			*/}
		</React.Fragment>
	}

	renderRundowns (list: RundownPlaylistUi[]) {
		const { t } = this.props

		return list.length > 0 ?
			list.map((rundownPlaylist) => (
				<RundownListItem key={rundownPlaylist._id} rundownPlaylist={rundownPlaylist} t={this.props.t} />
			)) :
			<tr>
				<td colSpan={9}>{t('There are no rundowns ingested into Sofie.')}</td>
			</tr>
	}

	render () {
		const { t } = this.props

		const syncedRundownPlaylists = this.props.rundownPlaylists.filter(rundownPlaylist => rundownPlaylist.unsyncedRundowns.length === 0)
		const unsyncedRundownPlaylists = this.props.rundownPlaylists.filter(rundownPlaylist => rundownPlaylist.unsyncedRundowns.length > 0)

		return <React.Fragment>
			{
				this.props.coreSystem ? this.registerHelp(this.props.coreSystem) : null
			}
			{
				(
					this.props.coreSystem &&
					this.props.coreSystem.version === GENESIS_SYSTEM_VERSION &&
					syncedRundownPlaylists.length === 0 &&
					unsyncedRundownPlaylists.length === 0
				) ?
				<div className='mtl gutter has-statusbar'>
					<h1>{t('Getting Started')}</h1>
					<div>
						<ul>
							<li>
								{t('Start with giving this browser configuration permissions by adding this to the URL: ')}&nbsp;
								<Tooltip overlay={t('Start Here!')} visible={this.tooltipStep() === ToolTipStep.TOOLTIP_START_HERE} placement='top'>
									<a href='?configure=1'>
										?configure=1
									</a>
								</Tooltip>
								{this.tooltipStep}
							</li>
							<li>
								{t('Then, run the migrations script:')}&nbsp;
								<Tooltip overlay={t('Run Migrations to get set up')} visible={this.tooltipStep() === ToolTipStep.TOOLTIP_RUN_MIGRATIONS} placement='bottom'>
									<a href='/settings/tools/migration'>
										{t('Migrations')}
									</a>
								</Tooltip>
							</li>
						</ul>
						{t('Documentation is available at')}&nbsp;
						<a href='https://github.com/nrkno/Sofie-TV-automation/'>
							https://github.com/nrkno/Sofie-TV-automation/
						</a>
					</div>
				</div> : null
			}
			<div className='mtl gutter has-statusbar'>
				<header className='mvs'>
					<h1>{t('Rundowns')}</h1>
				</header>
				{ this.state.subsReady ?
					<div className='mod mvl'>
						<table className='table system-status-table expando expando-tight'>
							<thead>
								<tr className='hl'>
									<th className='c3'>
										<Tooltip
											overlay={t('Click on a rundown to control your studio')}
											visible={getHelpMode()}
											placement='top'>
											<span>{t('Rundown')}</span>
										</Tooltip>
									</th>
									<th className='c2'>
										{t('Studio')}
									</th>
									<th className='c2'>
										{t('Show style')}
									</th>
									<th className='c2'>
										{t('Created')}
									</th>
									<th className='c2'>
										{t('On Air Start Time')}
									</th>
									<th className='c1'>
										{t('Duration')}
									</th>
									<th className='c1'>
										{t('Status')}
									</th>
									<th className='c1'>
										{t('Air Status')}
									</th>
									<th className='c1'>
										&nbsp;
									</th>
								</tr>
							</thead>
							<tbody>
								{this.renderRundowns(syncedRundownPlaylists)}
							</tbody>
							{unsyncedRundownPlaylists.length > 0 && <tbody>
								<tr className='hl'>
									<th colSpan={9} className='pvn phn'>
										<h2 className='mtm mbs mhn'>{t('Unsynced from MOS')}</h2>
									</th>
								</tr>
							</tbody>}
							{unsyncedRundownPlaylists.length > 0 && <tbody>
								{this.renderRundowns(unsyncedRundownPlaylists)}
							</tbody>}
						</table>
					</div> :
					<Spinner />
				}
			</div>
			<div className='mtl gutter version-info'>
				<p>
					{t('Sofie Automation')} {t('version')}: {PackageInfo.version || 'UNSTABLE'}
				</p>
				<div>
					{
						this.state.systemStatus ?
							<React.Fragment>
								<div>
									{t('System Status')}:&nbsp;
									<Tooltip
										overlay={t('System has issues which need to be resolved')}
										visible={
											this.state.systemStatus.status === 'FAIL'
											&& getHelpMode()
										}
										placement='top'>
										<span>{this.state.systemStatus.status}</span>
									</Tooltip>
									&nbsp;/&nbsp;{this.state.systemStatus._internal.statusCodeString}
								</div>
								<div>
									{
										this.state.systemStatus._internal.messages.length ?
											<div>
												{t('Status Messages:')}
												<ul>
													{_.map(this.state.systemStatus._internal.messages, (message, i) => {
														return (
															<li key={i}>
																{message}
															</li>
														)
													})}
												</ul>
											</div> :
										null
									}
								</div>
							</React.Fragment>
							: null
					}
				</div>
				{
					getAllowDeveloper() ?
					<ManualPlayout></ManualPlayout> : null
				}
			</div>
		</React.Fragment>
	}
}
)

interface IActiveProgressBarProps {
	rundown: Rundown
}

const ActiveProgressBar = timer(1000)(class extends React.Component<IActiveProgressBarProps> {
	render () {
		return (this.props.rundown.startedPlayback && this.props.rundown.expectedDuration ?
			<div className='progress-bar'>
				<div className='pb-indicator' style={{
					'width': Math.min(((getCurrentTime() - this.props.rundown.startedPlayback) / this.props.rundown.expectedDuration) * 100, 100) + '%'
				}} />
			</div> : null
		)
	}
})
