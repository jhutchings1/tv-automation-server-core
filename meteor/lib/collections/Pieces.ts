import { Mongo } from 'meteor/mongo'
import { RundownAPI } from '../api/rundown'
import { TimelineTransition } from 'timeline-state-resolver-types'
import { TransformedCollection } from '../typings/meteor'
import { PartTimings } from './Parts'
import { registerCollection } from '../lib'
import { Meteor } from 'meteor/meteor'
import {
	IBlueprintPieceGeneric,
	IBlueprintPiece,
	PieceLifespan,
	Timeline,
	BaseContent,
} from 'tv-automation-sofie-blueprints-integration'

/** A Single item in a "line": script, VT, cameras */
export interface PieceGeneric extends IBlueprintPieceGeneric {
	// ------------------------------------------------------------------
	_id: string
	/** ID of the source object in MOS */
	externalId: string
	/** The rundown this item belongs to */
	rundownId: string

	/** Playback availability status */
	status: RundownAPI.LineItemStatusCode
	/** Actual duration of the item, as played-back, in milliseconds. This value will be updated during playback for some types of items. */
	duration?: number
	/** A flag to signal a given Piece has been deactivated manually */
	disabled?: boolean
	/** A flag to signal that a given Piece should be hidden from the UI */
	hidden?: boolean
	/** A flag to signal that a given Piece has no content, and exists only as a marker on the timeline */
	virtual?: boolean
	/** The transition used by this piece to transition to and from the item */
	transitions?: {
		/** In transition for the item */
		inTransition?: TimelineTransition
		/** The out transition for the item */
		outTransition?: TimelineTransition
	}
	/** The id of the item this item is a continuation of. If it is a continuation, the inTranstion must not be set, and trigger must be 0 */
	continuesRefId?: string
	/** If this item has been created play-time using an AdLibItem, this should be set to it's source item */
	adLibSourceId?: string
	/** If this item has been insterted during run of rundown (such as adLibs). Df set, this won't be affected by updates from MOS */
	dynamicallyInserted?: boolean,
	/** The time the system started playback of this part, null if not yet played back (milliseconds since epoch) */
	startedPlayback?: number
	/** Playout timings, in here we log times when playout happens */
	timings?: PartTimings

	isTransition?: boolean
	extendOnHold?: boolean
}

export interface Piece extends PieceGeneric, IBlueprintPiece {
	// -----------------------------------------------------------------------

	partId: string
	expectedDuration: number | string
	/** This is a backup of the original expectedDuration of the item, so that the normal field can be modified during playback and restored afterwards */
	originalExpectedDuration?: number | string
	/** This is set when an item's duration needs to be overriden */
	durationOverride?: number
	/** This is set when the item is infinite, to deduplicate the contents on the timeline, while allowing out of order */
	infiniteMode?: PieceLifespan
	/** This is a backup of the original infiniteMode of the item, so that the normal field can be modified during playback and restored afterwards */
	originalInfiniteMode?: PieceLifespan
	/** This is the id of the original segment of an infinite item chain. If it matches the id of itself then it is the first in the chain */
	infiniteId?: string

	/** The object describing the item in detail */
	content?: BaseContent // TODO: Temporary, should be put into IBlueprintPiece

	/** Whether the piece has stopped playback (the most recent time it was played).
	 * This is set from a callback from the playout gateway
	 */
	stoppedPlayback?: number

	/** This is set when the item isn't infinite, but should overflow it's duration onto the adjacent (not just next) part on take */
	overflows?: boolean
}

export const Pieces: TransformedCollection<Piece, Piece>
	= new Mongo.Collection<Piece>('pieces')
registerCollection('Pieces', Pieces)
Meteor.startup(() => {
	if (Meteor.isServer) {
		Pieces._ensureIndex({
			rundownId: 1,
			partId: 1
		})
	}
})