"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const scannerModules_1 = require("./scannerModules");
const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .option('refreshAll', {
    alias: 'all',
    description: 'Refresh both dynamic and static metadata',
    type: 'boolean',
})
    .option('includeNSFW', {
    alias: 'nsfw',
    description: 'Refresh dynamic metadata and nsfw field',
    type: 'boolean',
})
    .option('includeTags', {
    alias: 'tags',
    description: 'Refresh dynamic metadata and tags',
    type: 'boolean',
})
    .option('includeVA', {
    alias: 'vas',
    description: 'Refresh dynamic metadata and voice actors',
    type: 'boolean',
})
    .argv;
const updateOptions = {};
if (argv.refreshAll)
    updateOptions.refreshAll = true;
else if (argv.includeNSFW)
    updateOptions.includeNSFW = true;
else if (argv.includeTags)
    updateOptions.includeTags = true;
else if (argv.includeVA)
    updateOptions.includeVA = true;
(0, scannerModules_1.performUpdate)(updateOptions)
    .then(() => process.exit(0))
    .catch((err) => { throw err; });
