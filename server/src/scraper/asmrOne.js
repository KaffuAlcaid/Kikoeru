"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeWorkMetadataFromAsmrOne = scrapeWorkMetadataFromAsmrOne;
const axios_1 = require("./axios");
const utils_1 = require("./utils");
const idConverter_1 = require("../filesystem/idConverter");
const CANDIDATE_URLS = [
    'https://api.asmr.one',
    'https://api.asmr-200.com',
    'https://api.asmr-100.com',
    'https://api.asmr-300.com',
];
const URL_CACHE_TTL = 20 * 60 * 1000;
let cachedUrl = null;
let cachedUrlExpiry = 0;
async function selectWorkingUrl() {
    const now = Date.now();
    if (cachedUrl && now < cachedUrlExpiry) {
        return cachedUrl;
    }
    console.log('[ASMR ONE] 开始 URL 可用性测试...');
    for (const candidate of CANDIDATE_URLS) {
        try {
            const response = await (0, axios_1.retryGet)(`${candidate}/api/workInfo/1`, {
                retry: { limit: 0 },
                timeout: 5000,
                headers: { cookie: 'locale=zh-cn' },
            });
            if (response.data) {
                cachedUrl = candidate;
                cachedUrlExpiry = now + URL_CACHE_TTL;
                console.log(`[ASMR ONE] ✅ 选定 ${candidate}，有效期至 ${new Date(cachedUrlExpiry).toISOString()}`);
                return cachedUrl;
            }
        }
        catch {
            console.log(`[ASMR ONE] ❌ ${candidate} 不可用`);
        }
    }
    console.warn('[ASMR ONE] 所有候选 URL 均不可用，使用默认地址');
    cachedUrl = CANDIDATE_URLS[0];
    cachedUrlExpiry = now + URL_CACHE_TTL;
    return cachedUrl;
}
async function scrapeWorkMetadataFromAsmrOne(id) {
    const baseUrl = await selectWorkingUrl();
    const rjcode = (0, idConverter_1.idNumberToCode)(id);
    const digits = (0, idConverter_1.getIdDigitFromString)(rjcode);
    const url = `${baseUrl}/api/workInfo/${digits}`;
    const response = await (0, axios_1.retryGet)(url, {
        retry: {},
        headers: { cookie: 'locale=zh-cn' },
    });
    const data = response.data;
    data.vas.forEach((va) => {
        va.id = (0, utils_1.nameToUUID)(va.name);
    });
    data.original_work_id = id;
    return data;
}
