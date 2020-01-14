// @todo: these typings are duplicates from the integration

export interface DeviceConfigManifest {
	deviceConfig: ConfigManifestEntry[];
	deviceOAuthFlow?: DeviceOAuthFlow;
	// subdeviceSummaryStringFormat: string // TODO - verify format
	// subDeviceConfig?: SubDeviceConfigManifest
}

export interface SubDeviceConfigManifest {
	defaultType: string;
	config: { [type: string]: SubDeviceConfigManifestEntry[] };
}

export interface DeviceOAuthFlow {
	credentialsHelp: string;
	credentialsURL: string;
}

// TODO - what about mappings from playout?

export enum ConfigManifestEntryType {
	LABEL = 'label',
	LINK = 'link',
	STRING = 'string',
	BOOLEAN = 'boolean',
	NUMBER = 'float',
	FLOAT = 'float',
	INT = 'int',
	CREDENTIALS = 'credentials', // TODO - parent only
	TABLE = 'table', // TODO - write this for HTTPSEND
	OBJECT = 'object',
	ENUM = 'enum' // @todo: implement
}

export type ConfigManifestEntry = ConfigManifestEntryBase | TableConfigManifestEntry;
export interface ConfigManifestEntryBase {
	id: string;
	name: string;
	type: ConfigManifestEntryType;
}
export interface SubDeviceConfigManifestEntry extends ConfigManifestEntryBase {
	columnName?: string;
	columnEditable?: boolean;
	defaultVal?: any; // TODO - is this wanted?
}

export interface TableConfigManifestEntry extends ConfigManifestEntryBase {
	/** Whether this follows the deviceId logic for updating */
	isSubDevices?: boolean;
	subDeviceDefaultName?: string;
	defaultType?: string;
	type: ConfigManifestEntryType.TABLE;
	deviceTypesMapping?: any;
	typeField?: string;
	/** Only one type means that the option will not be present */
	config: { [type: string]: ConfigManifestEntry[] };
}