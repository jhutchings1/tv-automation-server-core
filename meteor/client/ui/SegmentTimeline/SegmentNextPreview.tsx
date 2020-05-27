import * as React from 'react'

import * as ClassNames from 'classnames'
import * as _ from 'underscore'
import { translate } from 'react-i18next'

import { RundownPlaylist } from '../../../lib/collections/RundownPlaylists'
import { Rundown } from '../../../lib/collections/Rundowns'

import { PartUi, IOutputLayerUi, ISourceLayerUi, PieceUi } from './SegmentTimelineContainer'
import { SourceLayerItemContainer } from './SourceLayerItemContainer'
import { Translated } from '../../lib/ReactMeteorData/ReactMeteorData'
import { unprotectString } from '../../../lib/lib'

interface IProps {
	playlist: RundownPlaylist
	part?: PartUi
	outputGroups?: {
		[key: string]: IOutputLayerUi
	}
	sourceLayers?: {
		[key: string]: ISourceLayerUi
	}
	collapsedOutputs: {
		[key: string]: boolean
	}
	isCollapsed?: boolean
}

export const SegmentNextPreview = translate()(
	class SegmentNextPreview extends React.Component<Translated<IProps>> {
		renderSourceLayers(outputLayer: IOutputLayerUi, layers: ISourceLayerUi[] | undefined) {
			if (layers) {
				return layers
					.filter((i) => !i.isHidden)
					.sort((a, b) => a._rank - b._rank)
					.map((layer, id) => {
						return (
							<div className="segment-timeline__layer" key={id}>
								{layer.followingItems &&
									layer.followingItems
										.filter((piece) => {
											// filter only pieces belonging to this part
											return (
												this.props.part &&
												(piece.instance.partInstanceId === this.props.part.instance._id
													? // filter only pieces, that have not yet been linked to parent items
													  (piece as PieceUi).linked !== true
														? true
														: // (this.props.scrollLeft >= ((this.props.part.startsAt || 0) + ((piece as PieceUi).renderedInPoint || 0)))
														  true
													: false)
											)
										})
										.map((piece) => {
											return (
												this.props.part && (
													<SourceLayerItemContainer
														key={unprotectString(piece.instance._id)}
														{...this.props}
														// The following code is fine, just withTracker HOC messing with available props
														isLiveLine={false}
														isNextLine={false}
														outputGroupCollapsed={this.props.collapsedOutputs[outputLayer._id] === true}
														followLiveLine={false}
														liveLineHistorySize={0}
														livePosition={0}
														playlist={this.props.playlist}
														piece={piece}
														layer={layer}
														outputLayer={outputLayer}
														part={this.props.part}
														partStartsAt={0}
														partDuration={1}
														timeScale={1}
														relative={true}
														autoNextPart={false}
														liveLinePadding={0}
														scrollLeft={0}
														scrollWidth={1}
														mediaPreviewUrl=""
													/>
												)
											)
										})}
							</div>
						)
					})
			} else {
				return null
			}
		}
		renderOutputGroups() {
			if (this.props.outputGroups) {
				return _.map(
					_.filter(this.props.outputGroups, (layer) => {
						return layer.used ? true : false
					}).sort((a, b) => {
						return a._rank - b._rank
					}),
					(layer, id) => {
						return (
							<div
								className={ClassNames('segment-timeline__output-group', {
									collapsable: layer.sourceLayers && layer.sourceLayers.length > 1,
									collapsed: this.props.collapsedOutputs[layer._id] === true,
								})}
								key={id}>
								{this.renderSourceLayers(layer, layer.sourceLayers)}
							</div>
						)
					}
				)
			} else {
				return null
			}
		}
		renderPart() {
			return (
				<div className="segment-timeline__part" data-obj-id={this.props.part ? this.props.part.instance._id : '(NONE)'}>
					{this.renderOutputGroups()}
				</div>
			)
		}
		render() {
			return (
				<React.Fragment>
					<div className="segment-timeline__next-preview">{this.props.part && this.renderPart()}</div>
					<div className="segment-timeline__next-preview-background"></div>
				</React.Fragment>
			)
		}
	}
)
