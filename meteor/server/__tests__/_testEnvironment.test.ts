import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'
import { RandomMock } from '../../__mocks__/random'
import { MongoMock } from '../../__mocks__/mongo'

import { waitForPromise, protectString } from '../../lib/lib'
import { testInFiber } from '../../__mocks__/helpers/jest'

import { AdLibPieces } from '../../lib/collections/AdLibPieces'
import { AsRunLog } from '../../lib/collections/AsRunLog'
import { Blueprints } from '../../lib/collections/Blueprints'
import { CoreSystem } from '../../lib/collections/CoreSystem'
import { Evaluations } from '../../lib/collections/Evaluations'
import { ExpectedMediaItems } from '../../lib/collections/ExpectedMediaItems'
import { ExternalMessageQueue } from '../../lib/collections/ExternalMessageQueue'
import { IngestDataCache } from '../../lib/collections/IngestDataCache'
import { MediaObjects } from '../../lib/collections/MediaObjects'
import { MediaWorkFlows } from '../../lib/collections/MediaWorkFlows'
import { MediaWorkFlowSteps } from '../../lib/collections/MediaWorkFlowSteps'
import { Parts } from '../../lib/collections/Parts'
import { PeripheralDeviceCommands } from '../../lib/collections/PeripheralDeviceCommands'
import { PeripheralDevices } from '../../lib/collections/PeripheralDevices'
import { Pieces } from '../../lib/collections/Pieces'
import { RecordedFiles } from '../../lib/collections/RecordedFiles'
import { RundownBaselineAdLibPieces } from '../../lib/collections/RundownBaselineAdLibPieces'
import { RundownBaselineObjs } from '../../lib/collections/RundownBaselineObjs'
import { Rundowns } from '../../lib/collections/Rundowns'
import { Segments } from '../../lib/collections/Segments'
import { ShowStyleBases } from '../../lib/collections/ShowStyleBases'
import { ShowStyleVariants } from '../../lib/collections/ShowStyleVariants'
import { Snapshots } from '../../lib/collections/Snapshots'
import { Studios, DBStudio } from '../../lib/collections/Studios'
import { Timeline } from '../../lib/collections/Timeline'
import { UserActionsLog } from '../../lib/collections/UserActionsLog'
import { isInFiber } from '../../__mocks__/Fibers'

describe('Basic test of test environment', () => {
	testInFiber('Check that tests will run in fibers correctly', () => {
		// This code runs in a fiber
		expect(isInFiber()).toBeTruthy()

		const val = asynchronousFibersFunction(1, 2, 3)
		expect(val).toEqual(1 + 2 + 3)

		let p = Promise.resolve()
			.then(() => {
				expect(isInFiber()).toBeTruthy()
				return 'a'
			})
			.then((val) => {
				return new Promise((resolve) => {
					expect(isInFiber()).toBeTruthy()
					resolve(val)
				})
			})
		expect(waitForPromise(p)).toEqual('a')
	})
	test('Test Meteor Random mock', () => {
		RandomMock.mockIds = ['superRandom']
		expect(tempTestRandom()).toEqual('superRandom')
	})
	test('Verify Mock collections', () => {
		// @ts-ignore
		expect(AdLibPieces._isMock).toBeTruthy()
		// @ts-ignore
		expect(AsRunLog._isMock).toBeTruthy()
		// @ts-ignore
		expect(Blueprints._isMock).toBeTruthy()
		// @ts-ignore
		expect(CoreSystem._isMock).toBeTruthy()
		// @ts-ignore
		expect(Evaluations._isMock).toBeTruthy()
		// @ts-ignore
		expect(ExpectedMediaItems._isMock).toBeTruthy()
		// @ts-ignore
		expect(ExternalMessageQueue._isMock).toBeTruthy()
		// @ts-ignore
		expect(IngestDataCache._isMock).toBeTruthy()
		// @ts-ignore
		expect(MediaObjects._isMock).toBeTruthy()
		// @ts-ignore
		expect(MediaWorkFlows._isMock).toBeTruthy()
		// @ts-ignore
		expect(MediaWorkFlowSteps._isMock).toBeTruthy()
		// @ts-ignore
		expect(Parts._isMock).toBeTruthy()
		// @ts-ignore
		expect(PeripheralDeviceCommands._isMock).toBeTruthy()
		// @ts-ignore
		expect(PeripheralDevices._isMock).toBeTruthy()
		// @ts-ignore
		expect(Pieces._isMock).toBeTruthy()
		// @ts-ignore
		expect(RecordedFiles._isMock).toBeTruthy()
		// @ts-ignore
		expect(RundownBaselineAdLibPieces._isMock).toBeTruthy()
		// @ts-ignore
		expect(RundownBaselineObjs._isMock).toBeTruthy()
		// @ts-ignore
		expect(Rundowns._isMock).toBeTruthy()
		// @ts-ignore
		expect(Segments._isMock).toBeTruthy()
		// @ts-ignore
		expect(ShowStyleBases._isMock).toBeTruthy()
		// @ts-ignore
		expect(ShowStyleVariants._isMock).toBeTruthy()
		// @ts-ignore
		expect(Snapshots._isMock).toBeTruthy()
		// @ts-ignore
		expect(Studios._isMock).toBeTruthy()
		// @ts-ignore
		expect(Timeline._isMock).toBeTruthy()
		// @ts-ignore
		expect(UserActionsLog._isMock).toBeTruthy()
	})
	test('Test Mock collection data', () => {
		expect(Studios.find().fetch()).toHaveLength(0)

		MongoMock.mockSetData<DBStudio>(Studios, [
			{
				_id: protectString('abc'),
				name: 'abc',
				mappings: {},
				supportedShowStyleBase: [],
				config: [],
				settings: { mediaPreviewsUrl: '', sofieUrl: '' },
				_rundownVersionHash: 'abc',
			},
			{
				_id: protectString('def'),
				name: 'def',
				mappings: {},
				supportedShowStyleBase: [],
				config: [],
				settings: { mediaPreviewsUrl: '', sofieUrl: '' },
				_rundownVersionHash: 'def',
			},
		])

		expect(Studios.find().fetch()).toHaveLength(2)

		expect(
			Studios.findOne({
				_id: protectString('def'),
			})
		).toMatchObject({
			_id: 'def',
		})
		Studios.update(protectString('abc'), {
			$set: {
				_rundownVersionHash: 'myHash',
			},
		})

		expect(
			Studios.findOne({
				name: 'abc',
			})
		).toMatchObject({
			_rundownVersionHash: 'myHash',
		})

		Studios.remove(protectString('def'))
		const studios = Studios.find().fetch()
		expect(studios).toHaveLength(1)

		const observer = Studios.find({ _id: protectString('abc') }).observeChanges({})
		expect(observer).toBeTruthy()

		Studios.insert({
			_id: protectString('xyz'),
			name: 'xyz',
			mappings: {},
			supportedShowStyleBase: [],
			config: [],
			settings: { mediaPreviewsUrl: '', sofieUrl: '' },
			_rundownVersionHash: 'xyz',
		})
		expect(Studios.find().fetch()).toHaveLength(2)

		observer.stop()

		MongoMock.mockSetData(Studios, null)
		expect(Studios.find().fetch()).toHaveLength(0)
	})
	testInFiber('Promises in fibers', () => {
		let p = new Promise((resolve) => {
			setTimeout(() => {
				resolve('yup')
			}, 10)
		})

		const result = waitForPromise(p)

		expect(result).toEqual('yup')
	})
})

function asynchronousFibersFunction(a: number, b: number, c: number): number {
	const val = innerAsynchronousFiberFunction(a, b) + c
	return val
}

const innerAsynchronousFiberFunction = Meteor.wrapAsync((val0, val1, cb) => {
	setTimeout(() => {
		cb(undefined, val0 + val1)
	}, 10)
})

export function tempTestRandom() {
	return Random.id()
}
