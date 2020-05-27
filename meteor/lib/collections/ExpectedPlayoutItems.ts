import { Meteor } from 'meteor/meteor'
import { TransformedCollection } from '../typings/meteor'
import { registerCollection, ProtectedString } from '../lib'
import { createMongoCollection } from './lib'
import { ExpectedPlayoutItemGeneric } from 'tv-automation-sofie-blueprints-integration'
import { StudioId } from './Studios'
import { RundownId } from './Rundowns'
import { PartId } from './Parts'
import { PieceId } from './Pieces'

/** A string, identifying a Rundown */
export type ExpectedPlayoutItemId = ProtectedString<'ExpectedPlayoutItemId'>
export interface ExpectedPlayoutItem extends ExpectedPlayoutItemGeneric {
	/** Globally unique id of the item */
	_id: ExpectedPlayoutItemId

	/** The studio installation this ExpectedPlayoutItem was generated in */
	studioId: StudioId
	/** The rundown id that is the source of this PlayoutItem */
	rundownId: RundownId
	/** The part id that is the source of this Playout Item */
	partId?: PartId
	/** The piece id that is the source of this Playout Item */
	pieceId: PieceId
}

export const ExpectedPlayoutItems: TransformedCollection<
	ExpectedPlayoutItem,
	ExpectedPlayoutItem
> = createMongoCollection<ExpectedPlayoutItem>('expectedPlayoutItems')
registerCollection('ExpectedPlayoutItems', ExpectedPlayoutItems)
Meteor.startup(() => {
	if (Meteor.isServer) {
		ExpectedPlayoutItems._ensureIndex({
			studioId: 1,
		})
		ExpectedPlayoutItems._ensureIndex({
			rundownId: 1,
		})
	}
})
