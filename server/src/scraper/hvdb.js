"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeWorkMetadataFromHVDB = void 0;
const cheerio = __importStar(require("cheerio"));
const axios_1 = require("./axios");
const utils_1 = require("./utils");
const idConverter_1 = require("../filesystem/idConverter");
function scrapeHvdbHtml(data) {
    const $ = cheerio.load(data);
    const work = { tags: [], vas: [], title: "", circle: { id: "", name: "" }, nsfw: false, id: 0 };
    work.title = $('input#Name').attr('value');
    function getId(text) {
        const reMatch = /\/(\d*)$/.exec(text);
        return reMatch ? reMatch[1] : "";
    }
    const circleElement = $('a.detailCircle');
    const circleName = circleElement.text();
    work.circle = {
        id: getId(circleElement.attr('href')),
        name: circleName.split("/")[0].trim()
    };
    work.nsfw = !$('input[name="SFW"]').attr('checked');
    $('a[href*="TagWorks"]').each((idx, e) => {
        const elem = $(e);
        work.tags.push({
            id: getId(elem.attr('href')),
            name: elem.text(),
        });
    });
    $('a[href*="CVWorks"]').each((idx, e) => {
        const elem = $(e);
        const cvName = elem.text();
        if ((0, utils_1.hasLetter)(cvName))
            return;
        work.vas.push({
            id: (0, utils_1.nameToUUID)(cvName),
            name: cvName,
        });
    });
    return work;
}
const scrapeWorkMetadataFromHVDB = (id) => new Promise((resolve, reject) => {
    const rjcode = (0, idConverter_1.idNumberToCode)(id);
    const url = `https://hvdb.me/Dashboard/WorkDetails/${rjcode}`;
    console.log(`[${rjcode}] 从 HVDB 抓取元数据...`);
    (0, axios_1.retryGet)(url, { retry: {} })
        .then(response => {
        console.log('res HVDB');
        return response.data;
    })
        .then((data) => {
        const work = scrapeHvdbHtml(data);
        work.id = id;
        if (work.tags.length === 0 && work.vas.length === 0) {
            reject(new Error('Couldn\'t parse data from HVDB work page.'));
        }
        else {
            console.log(`[${rjcode}] 成功从 HVDB 抓取元数据...`);
            resolve(work);
        }
    })
        .catch((error) => {
        if (error.response) {
            reject(new Error(`Couldn't request work page HTML (${url}), received: ${error.response.status}.`));
        }
        else if (error.request) {
            reject(error);
            console.log(error.request);
        }
        else {
            console.log('Error', error.message);
            reject(error);
        }
    });
});
exports.scrapeWorkMetadataFromHVDB = scrapeWorkMetadataFromHVDB;
