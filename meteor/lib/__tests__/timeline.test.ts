import { testInFiber } from '../../__mocks__/helpers/jest'
import { transformTimeline } from '../timeline'
import { TimelineObjGeneric, TimelineObjType, TimelineObjRundown } from '../collections/Timeline'
import { protectString } from '../lib'
import { TSR } from 'tv-automation-sofie-blueprints-integration'

describe('lib/timeline', () => {
	testInFiber('transformTimeline', () => {
		const timeline: TimelineObjRundown[] = [
			{
				_id: protectString('0'),
				id: '0',
				studioId: protectString('studio0'),
				objectType: TimelineObjType.RUNDOWN,
				enable: {
					start: 0,
				},
				content: {
					deviceType: TSR.DeviceType.ABSTRACT,
				},
				layer: 'L1',
			},
			{
				_id: protectString('child0'),
				id: 'child0',
				studioId: protectString('studio0'),
				objectType: TimelineObjType.RUNDOWN,
				enable: {
					start: 0,
				},
				content: {
					deviceType: TSR.DeviceType.ABSTRACT,
				},
				layer: 'L1',
				inGroup: 'group0',
			},
			{
				_id: protectString('child1'),
				id: 'child1',
				studioId: protectString('studio0'),
				objectType: TimelineObjType.RUNDOWN,
				enable: {
					start: 0,
				},
				content: {
					deviceType: TSR.DeviceType.ABSTRACT,
				},
				layer: 'L1',
				inGroup: 'group0',
			},
			{
				_id: protectString('group0'),
				id: 'group0',
				studioId: protectString('studio0'),
				objectType: TimelineObjType.RUNDOWN,
				enable: {
					start: 0,
				},
				content: {
					deviceType: TSR.DeviceType.ABSTRACT,
				},
				layer: 'L1',
				isGroup: true,
			},
			{
				_id: protectString('2'),
				id: '2',
				studioId: protectString('studio0'),
				objectType: TimelineObjType.RUNDOWN,
				enable: {
					start: 0,
				},
				content: {
					callBack: 'partPlaybackStarted',
					callBackData: {
						rundownId: 'myRundown0',
						partId: 'myPart0',
					},
					callBackStopped: 'partPlaybackStopped',
				},
				layer: 'L1',
				// @ts-ignore
				partId: 'myPart0',
			},
			{
				_id: protectString('3'),
				id: '3',
				studioId: protectString('studio0'),
				objectType: TimelineObjType.RUNDOWN,
				enable: {
					start: 0,
				},
				content: {
					callBack: 'piecePlaybackStarted',
					callBackData: {
						rundownId: 'myRundown0',
						pieceId: 'myPiece0',
					},
					callBackStopped: 'piecePlaybackStopped',
				},
				layer: 'L1',
				// @ts-ignore
				pieceId: 'myPiece0',
			},
		]
		const transformedTimeline = transformTimeline(timeline)

		expect(transformedTimeline).toHaveLength(4)

		expect(transformedTimeline[0]).toMatchObject({
			id: '0',
		})
		expect(transformedTimeline[3]).toMatchObject({
			id: 'group0',
		})
		expect(transformedTimeline[3].children).toHaveLength(2)

		expect(transformedTimeline[1]).toMatchObject({
			id: '2',
			content: {
				callBack: 'partPlaybackStarted',
				callBackData: {
					rundownId: 'myRundown0',
					partId: 'myPart0',
				},
				callBackStopped: 'partPlaybackStopped',
			},
		})
		expect(transformedTimeline[2]).toMatchObject({
			id: '3',
			content: {
				callBack: 'piecePlaybackStarted',
				callBackData: {
					rundownId: 'myRundown0',
					pieceId: 'myPiece0',
				},
				callBackStopped: 'piecePlaybackStopped',
			},
		})
	})
	testInFiber('missing id', () => {
		expect(() => {
			transformTimeline([
				// @ts-ignore missing: id
				{
					_id: protectString('0'),
					studioId: protectString('studio0'),
					objectType: TimelineObjType.RUNDOWN,
					enable: { start: 0 },
					content: { deviceType: TSR.DeviceType.ABSTRACT },
					layer: 'L1',
				},
			] as TimelineObjGeneric[])
		}).toThrowError(/missing id/)
	})
})
