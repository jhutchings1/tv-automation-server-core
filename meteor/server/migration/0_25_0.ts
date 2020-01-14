import { addMigrationSteps } from './databaseMigration';
import * as _ from 'underscore';
import { renamePropertiesInCollection, setExpectedVersion } from './lib';
import * as semver from 'semver';
import { getCoreSystem } from '../../lib/collections/CoreSystem';
import { getDeprecatedDatabases, dropDeprecatedDatabases } from './deprecatedDatabases/0_25_0';
import {
	asyncCollectionInsert,
	asyncCollectionInsertIgnore,
	waitForPromiseAll
} from '../../lib/lib';

import { AsRunLog } from '../../lib/collections/AsRunLog';
import { Evaluations } from '../../lib/collections/Evaluations';
import { ExpectedMediaItems } from '../../lib/collections/ExpectedMediaItems';
import { ExternalMessageQueue } from '../../lib/collections/ExternalMessageQueue';
import { MediaWorkFlows } from '../../lib/collections/MediaWorkFlows';
import { MediaWorkFlowSteps } from '../../lib/collections/MediaWorkFlowSteps';
import { PeripheralDevices } from '../../lib/collections/PeripheralDevices';
import { Segments } from '../../lib/collections/Segments';
import { ShowStyleBases } from '../../lib/collections/ShowStyleBases';
import { ShowStyleVariants } from '../../lib/collections/ShowStyleVariants';
import { Snapshots } from '../../lib/collections/Snapshots';
import { Timeline } from '../../lib/collections/Timeline';
import { AdLibPieces } from '../../lib/collections/AdLibPieces';
import { Pieces } from '../../lib/collections/Pieces';
import { RundownBaselineObjs } from '../../lib/collections/RundownBaselineObjs';
import { RundownBaselineAdLibPieces } from '../../lib/collections/RundownBaselineAdLibPieces';
import { Rundowns } from '../../lib/collections/Rundowns';
import { Parts } from '../../lib/collections/Parts';
import { Studios } from '../../lib/collections/Studios';
import { logger } from '../../lib/logging';
import { PeripheralDeviceAPI } from '../../lib/api/peripheralDevice';

// 0.25.0 (Release 10) // This is a big refactoring, with a LOT of renamings
addMigrationSteps('0.25.0', [
	{
		id: 'migrateDatabaseCollections',
		canBeRunAutomatically: true,
		validate: () => {
			let databaseSystem = getCoreSystem();

			// Only run this if version is under 0.25.0, in order to not create the deprecated databases
			if (databaseSystem && semver.satisfies(databaseSystem.version, '<0.25.0')) {
				const dbs = getDeprecatedDatabases();

				if (dbs) {
					let foundAnything: string | null = null;
					_.find(_.keys(dbs), (collectionName) => {
						const collection = dbs[collectionName];
						if (collection.findOne()) {
							foundAnything = collectionName;
							return true;
						}
					});
					if (foundAnything)
						return `Deprecated collection "${foundAnything}" is not empty`;
				}
			}
			return false;
		},
		migrate: () => {
			const dbs = getDeprecatedDatabases();

			if (dbs) {
				const ps: Promise<any>[] = [];

				dbs.SegmentLines.find().forEach((doc) => {
					ps.push(asyncCollectionInsertIgnore(Parts, doc));
				});
				dbs.SegmentLines.remove({});

				dbs.SegmentLineItems.find().forEach((doc) => {
					ps.push(asyncCollectionInsertIgnore(Pieces, doc));
				});
				dbs.SegmentLineItems.remove({});

				dbs.SegmentLineAdLibItems.find().forEach((doc) => {
					ps.push(asyncCollectionInsertIgnore(AdLibPieces, doc));
				});
				dbs.SegmentLineAdLibItems.remove({});

				dbs.RunningOrderBaselineItems.find().forEach((doc) => {
					ps.push(asyncCollectionInsertIgnore(RundownBaselineObjs, doc));
				});
				dbs.RunningOrderBaselineItems.remove({});

				// dbs.RunningOrderBaselineAdLibItems.find().forEach(doc => { ps.push(asyncCollectionInsertIgnore(RundownBaselineAdLibPieces, doc)) })
				// dbs.RunningOrderBaselineAdLibItems.remove({})

				dbs.StudioInstallations.find().forEach((doc) => {
					ps.push(asyncCollectionInsertIgnore(Studios, doc));
				});
				dbs.StudioInstallations.remove({});

				dbs.RunningOrderDataCache.remove({});
				waitForPromiseAll(ps);

				// Step 2: Drop the databases
				dropDeprecatedDatabases();
			}
		}
	},

	renamePropertiesInCollection(
		'asRunLog',
		AsRunLog,
		'AsRunLog',
		{
			rundownId: 'runningOrderId',
			// segmentId:	'segmentId',
			partId: 'segmentLineId',
			pieceId: 'segmentLineItemId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'Evaluations',
		Evaluations,
		'Evaluations',
		{
			rundownId: 'runningOrderId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'ExpectedMediaItems',
		ExpectedMediaItems,
		'ExpectedMediaItems',
		{
			rundownId: 'runningOrderId',
			partId: 'segmentLineId',
			studioId: 'studioInstallationId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'ExternalMessageQueue',
		ExternalMessageQueue,
		'ExternalMessageQueue',
		{
			rundownId: 'roId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'MediaWorkFlows',
		MediaWorkFlows,
		'MediaWorkFlows',
		{
			studioId: 'studioInstallationId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'MediaWorkFlowSteps',
		MediaWorkFlowSteps,
		'MediaWorkFlowSteps',
		{
			studioId: 'studioInstallationId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'PeripheralDevices',
		PeripheralDevices,
		'PeripheralDevices',
		{
			studioId: 'studioInstallationId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'Segments',
		Segments,
		'Segments',
		{
			externalId: 'mosId',
			rundownId: 'runningOrderId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'ShowStyleBases',
		ShowStyleBases,
		'ShowStyleBases',
		{
			_rundownVersionHash: '_runningOrderVersionHash'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'ShowStyleVariants',
		ShowStyleVariants,
		'ShowStyleVariants',
		{
			_rundownVersionHash: '_runningOrderVersionHash'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'Snapshots',
		Snapshots,
		'Snapshots',
		{
			rundownId: 'runningOrderId',
			type: {
				content: {
					rundown: 'runningorder'
				}
			}
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'Timeline',
		Timeline,
		'Timeline',
		{
			studioId: 'siId',
			rundownId: 'roId',
			objectType: {
				content: {
					rundown: 'ro'
				}
			}
		},
		'migrateDatabaseCollections'
	),

	renamePropertiesInCollection(
		'RundownBaselineObjs',
		RundownBaselineObjs,
		'RundownBaselineObjs',
		{
			rundownId: 'runningOrderId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'RundownBaselineAdLibPieces',
		RundownBaselineAdLibPieces,
		'RundownBaselineAdLibPieces',
		{
			externalId: 'mosId',
			partId: 'segmentLineId',
			rundownId: 'runningOrderId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'Rundowns',
		Rundowns,
		'Rundowns',
		{
			externalId: 'mosId',
			studioId: 'studioInstallationId',
			peripheralDeviceId: 'mosDeviceId',
			currentPartId: 'currentSegmentLineId',
			nextPartId: 'nextSegmentLineId',
			nextPartManual: 'nextSegmentLineManual',
			previousPartId: 'previousSegmentLineId',
			notifiedCurrentPlayingPartExternalId: 'currentPlayingStoryStatus'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'AdLibPieces',
		AdLibPieces,
		'AdLibPieces',
		{
			externalId: 'mosId',
			partId: 'segmentLineId',
			rundownId: 'runningOrderId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'Pieces',
		Pieces,
		'Pieces',
		{
			externalId: 'mosId',
			partId: 'segmentLineId',
			rundownId: 'runningOrderId'
		},
		'migrateDatabaseCollections'
	),
	renamePropertiesInCollection(
		'Parts',
		Parts,
		'Parts',
		{
			_rank: 'number',
			externalId: 'mosId',
			segmentId: 'string',
			rundownId: 'runningOrderId',
			title: 'slug',
			afterPart: 'afterSegmentLine'
		},
		'migrateDatabaseCollections'
	),
	{
		id: 'peripheralDevicesTypeAndSubtype',
		canBeRunAutomatically: true,
		validate: () => {
			const devices = PeripheralDevices.find({}).fetch();

			const devicesNeedFixing = _.filter(devices, (device) => {
				// Old devices had property: type: number
				// New devices has properties: category, type, subType

				return _.has(device, 'type') && !_.has(device, 'category');
			});

			if (devicesNeedFixing.length > 0) {
				return `PeripheralDevices contains ${devicesNeedFixing.length} devices that needs updating`;
			}
			return false;
		},
		migrate: () => {
			const devices = PeripheralDevices.find({}).fetch();

			_.each(devices, (device) => {
				if (_.has(device, 'type') && !_.has(device, 'category')) {
					const m: {
						category: PeripheralDeviceAPI.DeviceCategory;
						type: PeripheralDeviceAPI.DeviceType;
						subType: PeripheralDeviceAPI.DeviceSubType;
					} = {
						category: 'unknown' as any,
						type: '' as any,
						subType: '' as any
					};
					enum OLDDeviceType { // From old typings
						MOSDEVICE = 0,
						PLAYOUT = 1,
						OTHER = 2, // i.e. sub-devices
						MEDIA_MANAGER = 3
					}
					const oldDeviceType = (device.type as any) as OLDDeviceType;

					if (oldDeviceType === OLDDeviceType.MOSDEVICE) {
						m.category = PeripheralDeviceAPI.DeviceCategory.INGEST;
						m.type = PeripheralDeviceAPI.DeviceType.MOS;
						m.subType = PeripheralDeviceAPI.SUBTYPE_PROCESS;
					} else if (oldDeviceType === OLDDeviceType.PLAYOUT) {
						m.category = PeripheralDeviceAPI.DeviceCategory.PLAYOUT;
						m.type = PeripheralDeviceAPI.DeviceType.PLAYOUT;
						m.subType = PeripheralDeviceAPI.SUBTYPE_PROCESS;
					} else if (oldDeviceType === OLDDeviceType.MEDIA_MANAGER) {
						m.category = PeripheralDeviceAPI.DeviceCategory.MEDIA_MANAGER;
						m.type = PeripheralDeviceAPI.DeviceType.MEDIA_MANAGER;
						m.subType = PeripheralDeviceAPI.SUBTYPE_PROCESS;
					} else if (oldDeviceType === OLDDeviceType.OTHER) {
						// Unknown sub-device
					}
					PeripheralDevices.update(device._id, { $set: m });
				}
			});
		}
	},
	{
		id: 'cleanUpExpectedItems',
		canBeRunAutomatically: true,
		validate: () => {
			const currentRundowns = Rundowns.find({})
				.fetch()
				.map((i) => i._id);
			const itemsCount = ExpectedMediaItems.find({
				rundownId: {
					$nin: currentRundowns
				}
			}).count();
			if (itemsCount > 0) {
				return `ExpectedMediaItems contains ${itemsCount} orphaned media-items`;
			}
			return false;
		},
		migrate: () => {
			const currentRundowns = Rundowns.find({})
				.fetch()
				.map((i) => i._id);
			ExpectedMediaItems.remove({
				rundownId: {
					$nin: currentRundowns
				}
			});
		}
	},
	setExpectedVersion(
		'expectedVersion.playoutDevice',
		PeripheralDeviceAPI.DeviceType.PLAYOUT,
		'_process',
		'^0.20.0'
	),
	setExpectedVersion(
		'expectedVersion.mosDevice',
		PeripheralDeviceAPI.DeviceType.MOS,
		'_process',
		'^0.8.0'
	),
	setExpectedVersion(
		'expectedVersion.mediaManager',
		PeripheralDeviceAPI.DeviceType.MEDIA_MANAGER,
		'_process',
		'^0.2.0'
	)
]);
