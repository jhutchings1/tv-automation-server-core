import { AdLibPiece } from './AdLibPieces'
import { TransformedCollection } from '../typings/meteor'
import { registerCollection } from '../lib'
import { Meteor } from 'meteor/meteor'
import { createMongoCollection } from './lib'

export interface RundownBaselineAdLibItem extends AdLibPiece {}

export const RundownBaselineAdLibPieces: TransformedCollection<
	RundownBaselineAdLibItem,
	RundownBaselineAdLibItem
> = createMongoCollection<RundownBaselineAdLibItem>('rundownBaselineAdLibPieces')
registerCollection('RundownBaselineAdLibPieces', RundownBaselineAdLibPieces)
Meteor.startup(() => {
	if (Meteor.isServer) {
		RundownBaselineAdLibPieces._ensureIndex({
			rundownId: 1,
		})
	}
})
