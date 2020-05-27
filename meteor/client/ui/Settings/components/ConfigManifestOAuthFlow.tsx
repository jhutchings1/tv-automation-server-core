import * as React from 'react'
import { translate } from 'react-i18next'
import { PeripheralDevice, SpreadsheetDevice } from '../../../../lib/collections/PeripheralDevices'
import { EditAttribute, EditAttributeBase } from '../../../lib/EditAttribute'
import { Translated } from '../../../lib/ReactMeteorData/react-meteor-data'
import { SpreadsheetDeviceSettings } from '../../../../lib/collections/PeripheralDeviceSettings/spreadsheet'
import { NotificationCenter, Notification, NoticeLevel } from '../../../lib/notifications/notifications'
import { PeripheralDeviceAPI } from '../../../../lib/api/peripheralDevice'
import { fetchFrom } from '../../../lib/lib'

interface IConfigManifestOAuthFlowComponentState {}
interface IConfigManifestOAuthFlowComponentProps {
	device: PeripheralDevice
}
export const ConfigManifestOAuthFlowComponent = translate()(
	class ConfigManifestOAuthFlowComponent extends React.Component<
		Translated<IConfigManifestOAuthFlowComponentProps>,
		IConfigManifestOAuthFlowComponentState
	> {
		constructor(props: Translated<IConfigManifestOAuthFlowComponentProps>) {
			super(props)
			this.state = {}
		}
		onUploadCredentialsFile(e) {
			const { t } = this.props

			const file = e.target.files[0]
			if (!file) {
				return
			}

			const reader = new FileReader()
			reader.onload = (e2) => {
				// On file upload

				this.setState({
					uploadFileKey: Date.now(),
				})

				console.log(e2)

				let uploadFileContents = (e2.target as any).result

				fetchFrom(`/devices/${this.props.device._id}/uploadCredentials`, {
					method: 'POST',
					body: uploadFileContents,
					headers: {
						'content-type': 'text/javascript',
					},
				})
					.then((res) => {
						NotificationCenter.push(
							new Notification(
								undefined,
								NoticeLevel.NOTIFICATION,
								t('Spreadsheet credentials succesfully uploaded.'),
								'SpreadsheetSettingsComponent'
							)
						)
					})
					.catch((err) => {
						NotificationCenter.push(
							new Notification(
								undefined,
								NoticeLevel.WARNING,
								t('Failed to upload spreadsheet credentials: {{errorMessage}}', { errorMessage: err + '' }),
								'SpreadsheetSettingsComponent'
							)
						)
					})

				// let uploadFileContents = (e2.target as any).result
				// let blueprint = this.props.blueprint

				// doModalDialog({
				// 	title: t('Update Blueprints?'),
				// 	message: <React.Fragment>
				// 		<p>{t('Are you sure you want to update the blueprints from the file "{{fileName}}"?', { fileName: file.name })}</p>,
				// 		<p>{t('Please note: This action is irreversible!')}</p>
				// 	</React.Fragment>,
				// 	onAccept: () => {
				// 		if (uploadFileContents && blueprint) {
				// 			fetch('/blueprints/restore/' + blueprint._id, {
				// 				method: 'POST',
				// 				body: uploadFileContents,
				// 				headers: {
				// 					'content-type': 'text/javascript'
				// 				},
				// 			}).then(res => {
				// 				console.log('Blueprint restore success')
				// 			}).catch(err => {
				// 				console.error('Blueprint restore failure: ', err)
				// 			})
				// 		}
				// 	},
				// 	onSecondary: () => {
				// 		this.setState({
				// 			uploadFileKey: Date.now()
				// 		})
				// 	}
				// })
			}
			reader.readAsText(file)
		}
		onUpdatedAccessToken(authToken: string) {
			authToken = (authToken + '').trim()
			console.log(authToken)
			if (authToken && authToken.length > 5) {
				PeripheralDeviceAPI.executeFunction(
					this.props.device._id,
					(e) => {
						if (e) {
							// nothing
							console.log(e)
							NotificationCenter.push(
								new Notification(undefined, NoticeLevel.WARNING, 'Error when authorizing access token: ' + e, '')
							)
						} else {
							NotificationCenter.push(new Notification(undefined, NoticeLevel.NOTIFICATION, 'Access token saved!', ''))
						}
					},
					'receiveAuthToken',
					authToken
				)
			}
		}
		render() {
			const { t } = this.props
			let settings = (this.props.device.settings || {}) as SpreadsheetDeviceSettings
			let device = this.props.device as SpreadsheetDevice
			return (
				<div>
					<div className="mod mvs mhn">
						<label className="field">
							{t('Application credentials')}
							<div className="mdi">
								<div>{t(device.configManifest.deviceOAuthFlow!.credentialsHelp)}</div>
								<div>
									<a href={device.configManifest.deviceOAuthFlow!.credentialsURL} target="_blank">
										{device.configManifest.deviceOAuthFlow!.credentialsURL}
									</a>
								</div>

								<div className="mdi">
									<input
										type="file"
										accept="application/json,.json"
										onChange={(e) => this.onUploadCredentialsFile(e)}
									/>
									<span className="mdfx"></span>
								</div>
							</div>
						</label>
						{settings.secretCredentials ? (
							<label className="field">
								{t('Access token')}
								<div className="mdi">
									<div>
										{t('Click on the link below and accept the permissions request. Paste the received URL below.')}
									</div>
									<div>
										{device.accessTokenUrl ? (
											<a href={device.accessTokenUrl} target="_blank">
												{device.accessTokenUrl}
											</a>
										) : (
											t('Waiting for gateway to generate URL...')
										)}
									</div>
									<EditAttribute
										modifiedClassName="bghl"
										updateFunction={(edit: EditAttributeBase, newValue: any) => {
											this.onUpdatedAccessToken(newValue)
										}}
										attribute=""
										type="text"
										className="mdinput"></EditAttribute>
								</div>
							</label>
						) : null}
					</div>
				</div>
			)
		}
	}
)
