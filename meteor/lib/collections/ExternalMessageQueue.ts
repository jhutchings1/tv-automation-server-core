import { TransformedCollection } from '../typings/meteor'
import { Time, registerCollection, ProtectedString } from '../lib'
import { Meteor } from 'meteor/meteor'
import {
	IBlueprintExternalMessageQueueObj,
	IBlueprintExternalMessageQueueType,
} from 'tv-automation-sofie-blueprints-integration'
import { createMongoCollection } from './lib'
import { StudioId } from './Studios'
import { RundownId } from './Rundowns'

/** A string, identifying a ExternalMessageQueueObj */
export type ExternalMessageQueueObjId = ProtectedString<'ExternalMessageQueueObjId'>

export interface ExternalMessageQueueObj extends IBlueprintExternalMessageQueueObj {
	_id: ExternalMessageQueueObjId
	/** Id of the studio this message originates from */
	studioId: StudioId
	/** (Optional) id of the rundown this message originates from */
	rundownId?: RundownId
	/** At this time the message will be removed */
	expires: Time
	/** Time of message creation */
	created: Time
	/** Number of times the message tried to be sent */
	tryCount: number
	/** Time of last send try: */
	lastTry?: Time
	/** If message send failed, last error message */
	errorMessage?: string
	/** If message send failed, last error message timestamp */
	errorMessageTime?: number
	/** Time of succeeded send: */
	sent?: Time
	/** Reply from receiver */
	sentReply?: any
	/** If true, wont retry any more */
	errorFatal?: boolean
	/** If true, wont retry (can be set from UI) */
	hold?: boolean

	/** Type of message */
	type: IBlueprintExternalMessageQueueType
	/** Receiver details */
	receiver: any
	/** Messate details */
	message: any
	/** Retry sending messages until this time */
	retryUntil?: Time
	/** Manual retry override (UI retry button) - retry once more */
	manualRetry?: boolean
}

export const ExternalMessageQueue: TransformedCollection<
	ExternalMessageQueueObj,
	ExternalMessageQueueObj
> = createMongoCollection<ExternalMessageQueueObj>('externalMessageQueue')
registerCollection('ExternalMessageQueue', ExternalMessageQueue)
Meteor.startup(() => {
	if (Meteor.isServer) {
		ExternalMessageQueue._ensureIndex({
			studioId: 1,
			created: 1,
		})
		ExternalMessageQueue._ensureIndex({
			sent: 1,
			lastTry: 1,
		})
		ExternalMessageQueue._ensureIndex({
			studioId: 1,
			rundownId: 1,
		})
	}
})
