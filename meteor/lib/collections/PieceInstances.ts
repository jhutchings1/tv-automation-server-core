import { TransformedCollection } from '../typings/meteor'
import { registerCollection, literal } from '../lib'
import { Meteor } from 'meteor/meteor'
import { IBlueprintPieceInstance, Time } from 'tv-automation-sofie-blueprints-integration'
import { createMongoCollection } from './lib'
import { Piece } from './Pieces'

export interface PieceInstance extends IBlueprintPieceInstance {
	_id: string
	/** The rundown this piece belongs to */
	rundownId: string
	/** The part instace this piece belongs to */
	partInstanceId: string

	piece: Piece
}

export function WrapPieceToTemporaryInstance (piece: Piece, partInstanceId: string): PieceInstance {
	return literal<PieceInstance>({
		_id: `${piece._id}_tmp_instance`,
		rundownId: piece.rundownId,
		partInstanceId: partInstanceId,
		piece: piece
	})
}

export function FindPieceInstanceOrWrapToTemporary (partInstances: PieceInstance[], partInstanceId: string, piece: Piece): PieceInstance {
	return partInstances.find(instance => instance.piece._id === piece._id) || WrapPieceToTemporaryInstance(piece, partInstanceId)
}

export const PieceInstances: TransformedCollection<PieceInstance, PieceInstance> = createMongoCollection<PieceInstance>('pieceInstances')
registerCollection('PieceInstances', PieceInstances)
Meteor.startup(() => {
	if (Meteor.isServer) {
		PieceInstances._ensureIndex({
			rundownId: 1,
			partInstanceId: 1
		})
	}
})