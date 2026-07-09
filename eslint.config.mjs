import domdomegg from 'eslint-config-domdomegg';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
	{
		ignores: ['dist/**'],
	},
	...domdomegg,
	{
		files: ['src/index.ts'],
		rules: {
			// serverless.cli.log is deprecated in favour of the Serverless V3 logging API,
			// but the plugin still supports the V2/V3 cli.log interface. Migrating the logging
			// is a functional change out of scope for this mechanical flat-config migration.
			'@typescript-eslint/no-deprecated': 'off',
		},
	},
];
