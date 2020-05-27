import { Random } from 'meteor/random'
import * as _ from 'underscore'
import { PeripheralDevices, PeripheralDevice } from '../../lib/collections/PeripheralDevices'
import { getCurrentTime, Time, unprotectString } from '../../lib/lib'
import { PeripheralDeviceAPI } from '../../lib/api/peripheralDevice'
import { parseVersion, parseRange } from '../../lib/collections/CoreSystem'
import { StatusResponse, CheckObj, ExternalStatus, CheckError } from '../../lib/api/systemStatus'
import { getRelevantSystemVersions } from '../coreSystem'
import * as semver from 'semver'
import { StudioId } from '../../lib/collections/Studios'

/**
 * Handling of system statuses
 */

/** Enum for the different status codes in the system  */
export enum StatusCode {
	/** Status unknown */
	UNKNOWN = 0,
	/** All good and green */
	GOOD = 1,
	/** Everything is not OK, operation is not affected */
	WARNING_MINOR = 2,
	/** Everything is not OK, operation might be affected */
	WARNING_MAJOR = 3,
	/** Operation affected, possible to recover */
	BAD = 4,
	/** Operation affected, not possible to recover without manual interference */
	FATAL = 5,
}
export interface StatusObject {
	studioId?: StudioId
	statusCode: StatusCode
	messages?: Array<string>
}
export interface StatusObjectInternal {
	studioId?: StudioId
	statusCode: StatusCode
	/** Timestamp when statusCode was last changed */
	timestamp: Time
	messages: Array<{
		message: string
		/** Timestamp when message appeared first */
		timestamp: Time
	}>
}
/**
 * Returns system status
 * @param studioId (Optional) If provided, limits the status to what's affecting the studio
 */
export function getSystemStatus(studioId?: StudioId): StatusResponse {
	let checks: Array<CheckObj> = []

	// Check systemStatuses:
	_.each(systemStatuses, (status: StatusObjectInternal, key: string) => {
		checks.push({
			description: key,
			status: status2ExternalStatus(status.statusCode),
			updated: new Date(status.timestamp).toISOString(),
			_status: status.statusCode,
			errors: _.map(
				status.messages || [],
				(m): CheckError => {
					return {
						type: 'message',
						time: new Date(m.timestamp).toISOString(),
						message: m.message,
					}
				}
			),
		})
	})

	let statusObj: StatusResponse = {
		name: 'Sofie Automation system',
		instanceId: instanceId,
		updated: new Date(getCurrentTime()).toISOString(),
		status: 'UNDEFINED',
		_status: StatusCode.UNKNOWN,
		documentation: 'https://github.com/nrkno/tv-automation-server-core',
		_internal: {
			// this _internal is set later
			statusCodeString: StatusCode[StatusCode.UNKNOWN],
			messages: [],
			versions: {},
		},
		checks: checks,
	}

	let devices = studioId ? PeripheralDevices.find({ studioId: studioId }).fetch() : PeripheralDevices.find({}).fetch()

	_.each(devices, (device: PeripheralDevice) => {
		let deviceStatus: StatusCode = device.status.statusCode
		let deviceStatusMessages: Array<string> = device.status.messages || []

		let checks: Array<CheckObj> = []

		if (deviceStatus === StatusCode.GOOD) {
			if (device.expectedVersions) {
				if (!device.versions) device.versions = {}
				let deviceVersions = device.versions
				_.each(device.expectedVersions, (expectedVersionStr, libraryName: string) => {
					let versionStr = deviceVersions[libraryName]

					let version = parseVersion(versionStr || '0.0.0')
					let expectedVersion = parseRange(expectedVersionStr)

					let statusCode = StatusCode.GOOD
					let messages: Array<string> = []

					if (semver.satisfies(version, '0.0.0')) {
						// if the major version is 0.0.0, ignore it
					} else if (!versionStr) {
						statusCode = StatusCode.BAD
						messages.push(`${libraryName}: Expected version ${expectedVersionStr}, got undefined`)
					} else if (!semver.satisfies(version, expectedVersion)) {
						statusCode = StatusCode.BAD

						let message = `Version for ${libraryName}: "${versionStr}" does not satisy expected version "${expectedVersionStr}"`

						const version0 = semver.coerce(version)
						const expectedVersion0 = semver.coerce(expectedVersion)

						if (version0 && expectedVersion0 && version0.major !== expectedVersion0.major) {
							statusCode = StatusCode.BAD
							message = `${libraryName}: Expected version ${expectedVersionStr}, got ${versionStr} (major version differ)`
						} else if (version0 && expectedVersion0 && version0.minor < expectedVersion0.minor) {
							statusCode = StatusCode.WARNING_MAJOR
							message = `${libraryName}: Expected version ${expectedVersionStr}, got ${versionStr} (minor version differ)`
						} else if (
							version0 &&
							expectedVersion0 &&
							version0.minor <= expectedVersion0.minor &&
							version0.patch < expectedVersion0.patch
						) {
							statusCode = StatusCode.WARNING_MINOR
							message = `${libraryName}: Expected version ${expectedVersionStr}, got ${versionStr} (patch version differ)`
						}

						messages.push(message)
					}

					checks.push({
						description: `expectedVersion.${libraryName}`,
						status: status2ExternalStatus(statusCode),
						updated: new Date(device.lastSeen).toISOString(),
						_status: statusCode,
						errors: _.map(
							messages,
							(message: string): CheckError => {
								return {
									type: 'version-differ',
									time: new Date(device.lastSeen).toISOString(),
									message: message,
								}
							}
						),
					})
				})
			}
		}
		let so: StatusResponse = {
			name: device.name,
			instanceId: unprotectString(device._id),
			status: 'UNDEFINED',
			updated: new Date(device.lastSeen).toISOString(),
			_status: deviceStatus,
			documentation: '',
			statusMessage: deviceStatusMessages.length ? deviceStatusMessages.join(', ') : undefined,
			_internal: {
				// statusCode: deviceStatus,
				statusCodeString: StatusCode[deviceStatus],
				messages: deviceStatusMessages,
				versions: device.versions || {},
			},
			checks: checks,
		}
		if (device.type === PeripheralDeviceAPI.DeviceType.MOS) {
			so.documentation = 'https://github.com/nrkno/tv-automation-mos-gateway'
		} else if (device.type === PeripheralDeviceAPI.DeviceType.SPREADSHEET) {
			so.documentation = 'https://github.com/SuperFlyTV/spreadsheet-gateway'
		} else if (device.type === PeripheralDeviceAPI.DeviceType.PLAYOUT) {
			so.documentation = 'https://github.com/nrkno/tv-automation-playout-gateway'
		} else if (device.type === PeripheralDeviceAPI.DeviceType.MEDIA_MANAGER) {
			so.documentation = 'https://github.com/nrkno/tv-automation-media-management'
		}

		if (!statusObj.components) statusObj.components = []
		statusObj.components.push(so)
	})

	let systemStatus: StatusCode = setStatus(statusObj)
	statusObj._internal = {
		// statusCode: systemStatus,
		statusCodeString: StatusCode[systemStatus],
		messages: collectMesages(statusObj),
		versions: getRelevantSystemVersions(),
	}
	statusObj.statusMessage = statusObj._internal.messages.join(', ')

	return statusObj
}
export function setSystemStatus(type: string, status: StatusObject) {
	let systemStatus: StatusObjectInternal = systemStatuses[type]
	if (!systemStatus) {
		systemStatus = {
			statusCode: StatusCode.UNKNOWN,
			timestamp: 0,
			messages: [],
		}
		systemStatuses[type] = systemStatus
	}

	if (systemStatus.statusCode !== status.statusCode) {
		systemStatus.statusCode = status.statusCode
		systemStatus.timestamp = getCurrentTime()
	}

	let messages: Array<{
		message: string
		timestamp: Time
	}> = []
	if (status.messages) {
		_.each(status.messages, (message) => {
			let m = _.find(systemStatus.messages, (m) => m.message === message)
			if (m) {
				messages.push(m)
			} else {
				messages.push({
					message: message,
					timestamp: getCurrentTime(),
				})
			}
		})
	}
	systemStatus.messages = messages
}
export function removeSystemStatus(type: string) {
	delete systemStatuses[type]
}
/** Random id for this running instance of core */
const instanceId = Random.id()
/** Map of surrent system statuses */
const systemStatuses: { [key: string]: StatusObjectInternal } = {}
function setStatus(statusObj: StatusResponse): StatusCode {
	let s: StatusCode = statusObj._status

	if (statusObj.checks) {
		_.each(statusObj.checks, (check: CheckObj) => {
			if (check._status > s) s = check._status
		})
	}
	if (statusObj.components) {
		_.each(statusObj.components, (component: StatusResponse) => {
			let s2: StatusCode = setStatus(component)
			if (s2 > s) s = s2
		})
	}
	statusObj.status = status2ExternalStatus(s)
	statusObj._status = s
	return s
}
function collectMesages(statusObj: StatusResponse): Array<string> {
	let allMessages: Array<string> = []

	if (statusObj._internal) {
		_.each(statusObj._internal.messages, (msg) => {
			allMessages.push(msg)
		})
	}
	if (statusObj.checks) {
		_.each(statusObj.checks, (check: CheckObj) => {
			if (check._status !== StatusCode.GOOD && check.errors) {
				_.each(check.errors, (errMsg) => {
					allMessages.push(`check ${check.description}: ${errMsg.message}`)
				})
			}
		})
	}
	if (statusObj.components) {
		_.each(statusObj.components, (component: StatusResponse) => {
			let messages = collectMesages(component)

			_.each(messages, (msg) => {
				allMessages.push(`${component.name}: ${msg}`)
			})
		})
	}
	return allMessages
}
export function status2ExternalStatus(statusCode: StatusCode): ExternalStatus {
	if (statusCode === StatusCode.GOOD) {
		return 'OK'
	} else if (statusCode === StatusCode.WARNING_MINOR || statusCode === StatusCode.WARNING_MAJOR) {
		return 'WARNING'
	} else if (statusCode === StatusCode.BAD || statusCode === StatusCode.FATAL) {
		return 'FAIL'
	}
	return 'UNDEFINED'
}
