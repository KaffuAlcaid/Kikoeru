"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultNVA = void 0;
exports.scrapeWorkMetadataFromDLsite = scrapeWorkMetadataFromDLsite;
exports.scrapeDynamicWorkMetadataFromDLsite = scrapeDynamicWorkMetadataFromDLsite;
exports.scrapeCoverIdForTranslatedWorkFromDLsite = scrapeCoverIdForTranslatedWorkFromDLsite;
exports.scrapeDlsiteJsonObject = scrapeDlsiteJsonObject;
const cheerio_1 = __importDefault(require("cheerio"));
const axios_1 = require("./axios");
const utils_1 = require("./utils");
const hvdb_1 = require("./hvdb");
const idConverter_1 = require("../filesystem/idConverter");
const config_1 = require("../config");
const globalKeyAndIv = (0, utils_1.getKeyAndIV)(config_1.config.metaCryptoKey);
function getLocalKeyText(language) {
    let AGE_RATINGS, VA, GENRE, RELEASE, SERIES, COOKIE_LOCALE;
    switch (language) {
        case 'ja-jp':
            COOKIE_LOCALE = 'locale=ja-jp';
            AGE_RATINGS = '年齢指定';
            GENRE = 'ジャンル';
            VA = '声優';
            RELEASE = '販売日';
            SERIES = 'シリーズ名';
            break;
        case 'zh-tw':
            COOKIE_LOCALE = 'locale=zh-tw';
            AGE_RATINGS = '年齡指定';
            GENRE = '分類';
            VA = '聲優';
            RELEASE = '販賣日';
            SERIES = '系列名';
            break;
        default:
            COOKIE_LOCALE = 'locale=zh-cn';
            AGE_RATINGS = '年龄指定';
            GENRE = '分类';
            VA = '声优';
            RELEASE = '贩卖日';
            SERIES = '系列名';
    }
    return {
        AGE_RATINGS, VA, GENRE, RELEASE, SERIES, COOKIE_LOCALE,
    };
}
const translationLangToLocaleLangMap = new Map([
    [`CHI_HANS`, `zh-cn`],
    [`CHI_HANT`, `zh-tw`],
]);
function translationLangToLocaleLang(transLang, defaultLang) {
    return translationLangToLocaleLangMap.get(transLang) || defaultLang;
}
function scrapeDlsiteHtml(htmlText, localeKeyTexts) {
    const work = {
        title: '',
        tags: [],
        vas: [],
        circle: {},
        nsfw: false,
        release: '',
        series: undefined,
    };
    const $ = cheerio_1.default.load(htmlText);
    work.title = $('meta[property="og:title"]').attr('content');
    if (work.title === undefined) {
        work.title = $(`a[href=""] span`).text();
    }
    const titlePattern = / \[.+\] \| DLsite$/;
    work.title = work.title.replace(titlePattern, '');
    const circleElement = $('span[class="maker_name"]').children('a');
    const circleUrl = circleElement.attr('href');
    const circleCode = RegExp(`(${idConverter_1.CIRCLE_ID_TYPE_LIST.join('|')})\\d+`).exec(circleUrl)[0];
    const circleName = circleElement.text();
    work.circle = (circleUrl && circleName)
        ? { id: (0, idConverter_1.circleCodeToId)(circleCode), name: circleName }
        : {};
    const workOutline = $('#work_outline');
    const R18 = workOutline.children('tbody').children('tr').children('th')
        .filter(function () {
        return $(this).text() === localeKeyTexts.AGE_RATINGS;
    }).parent().children('td').find('span:first').text();
    work.nsfw = R18 === '18禁';
    const release = workOutline.children('tbody').children('tr').children('th')
        .filter(function () {
        return $(this).text() === localeKeyTexts.RELEASE;
    }).parent().children('td').text().replace(/[^0-9]/ig, '');
    work.release = (release.length >= 8)
        ? `${release.slice(0, 4)}-${release.slice(4, 6)}-${release.slice(6, 8)}`
        : '';
    const seriesElement = workOutline.children('tbody').children('tr').children('th')
        .filter(function () {
        return $(this).text() === localeKeyTexts.SERIES;
    }).parent().children('td').children('a');
    if (seriesElement.length) {
        const seriesUrl = seriesElement.attr('href');
        if (seriesUrl.match(/SRI(\d{10})/)) {
            work.series = {
                id: parseInt(seriesUrl.match(/SRI(\d{10})/)[1]),
                name: seriesElement.text()
            };
        }
    }
    workOutline.children('tbody').children('tr').children('th')
        .filter(function () {
        return $(this).text() === localeKeyTexts.GENRE;
    }).parent().children('td').children('div').children('a').each(function () {
        const tagUrl = $(this).attr('href');
        const tagName = $(this).text();
        if (tagUrl.match(/genre\/(\d{3})/)) {
            work.tags.push({
                id: parseInt(tagUrl.match(/genre\/(\d{3})/)[1]),
                name: tagName
            });
        }
    });
    workOutline.children('tbody').children('tr').children('th')
        .filter(function () {
        return $(this).text() === localeKeyTexts.VA;
    }).parent().children('td').children('a').each(function () {
        const vaName = $(this).text().trim();
        work.vas.push({
            id: (0, utils_1.nameToUUID)(vaName),
            name: vaName
        });
    });
    return work;
}
function scrapeDlsiteJsonObject(jsonObj) {
    const work = {
        title: '',
        tags: [],
        vas: [],
        circle: {},
        nsfw: false,
        release: '',
        series: undefined,
    };
    const data = jsonObj[0];
    work.title = data.product_name;
    const titlePattern = / \[.+\] \| DLsite$/;
    work.title = work.title.replace(titlePattern, '');
    console.log(" circle id string raw = ", data.maker_id);
    work.circle = {
        id: (0, idConverter_1.circleCodeToId)(data.maker_id),
        name: data.maker_name
    };
    work.nsfw = data.age_category == 3;
    const releaseResult = /\d{4}-\d{2}-\d{2}/.exec(data.regist_date || data.update_date || "1970-01-01");
    work.release = releaseResult[0];
    work.tags = data.genres.map((v) => ({
        id: v.id,
        name: v.name
    }));
    if (Object.prototype.hasOwnProperty.call(data.creaters, "voice_by")) {
        work.vas = data.creaters.voice_by.map((v) => ({
            id: (0, utils_1.nameToUUID)(v.name),
            name: v.name
        }));
    }
    return work;
}
const defaultNVA = { id: (0, utils_1.nameToUUID)("N/A"), name: "N/A" };
exports.defaultNVA = defaultNVA;
async function scrapeStaticWorkMetadataFromDLsite(id, language, scrapeType, staticUrlPrefix) {
    const rjcode = (0, idConverter_1.idNumberToCode)(id);
    const localeKeyTexts = getLocalKeyText(language);
    let work = null, url = "";
    try {
        if (scrapeType === 'html') {
            url = `https://www.dlsite.com/maniax/work/=/product_id/${rjcode}.html`;
            const response = await (0, axios_1.retryGet)(url, {
                retry: {},
                headers: { "cookie": localeKeyTexts.COOKIE_LOCALE }
            });
            const data = response.data;
            work = scrapeDlsiteHtml(data, localeKeyTexts);
        }
        else if (scrapeType === 'json') {
            url = `${staticUrlPrefix}${rjcode}`;
            const response = await (0, axios_1.retryGet)(url, {
                retry: {},
                headers: { "cookie": `locale=${language}` }
            });
            response.data = (0, utils_1.decryptDataIfNeed)(response.data, globalKeyAndIv);
            const jsonObj = response.data;
            work = scrapeDlsiteJsonObject(jsonObj);
        }
    }
    catch (error) {
        if (error.response) {
            throw new Error(`Couldn't request work page HTML (${url}), received: ${error.response.status}.`);
        }
        else {
            throw error;
        }
    }
    work.id = id;
    if (work.vas.length > 0)
        return work;
    const idTypeString = (0, idConverter_1.getIDTypeString)(rjcode);
    if (idTypeString === "RJ") {
        try {
            const metadata = await (0, hvdb_1.scrapeWorkMetadataFromHVDB)(id);
            work.vas = metadata.vas;
        }
        catch (e) {
            console.log(`[${rjcode}] HVDB scrape voice actor failed, assume it do not have VA at all, error:`, e);
        }
    }
    if (work.vas.length === 0) {
        work.vas.push(defaultNVA);
    }
    return work;
}
async function scrapeDynamicWorkMetadataFromDLsite(id, dynamicUrlPrefix, staticUrlPrefix) {
    const rjcode = (0, idConverter_1.idNumberToCode)(id);
    const url = `${dynamicUrlPrefix}${rjcode}`;
    try {
        const response = await (0, axios_1.retryGet)(url, { retry: {} });
        response.data = (0, utils_1.decryptDataIfNeed)(response.data, globalKeyAndIv);
        let data = response.data[`${rjcode}`];
        if (data === undefined) {
            console.log(`[${rjcode}] 无法获取到动态元数据，尝试读取parent作品数据`);
            const jsonApiUrl = `${staticUrlPrefix}${rjcode}`;
            try {
                const response = await (0, axios_1.retryGet)(jsonApiUrl, { retry: {} });
                response.data = (0, utils_1.decryptDataIfNeed)(response.data, globalKeyAndIv);
                const parentWorkno = response.data[0]?.translation_info?.parent_workno;
                console.log(`[${rjcode}] parent作品为${parentWorkno}`);
                if (parentWorkno) {
                    console.log(`[${rjcode}] 读取parent作品动态元数据: ${parentWorkno}`);
                    const url = `${dynamicUrlPrefix}${parentWorkno}`;
                    const response = await (0, axios_1.retryGet)(url, { retry: {} });
                    response.data = (0, utils_1.decryptDataIfNeed)(response.data, globalKeyAndIv);
                    data = response.data[parentWorkno];
                    if (data === undefined) {
                        console.log(`[${rjcode}] 读取parent作品动态元数据失败`);
                    }
                }
            }
            catch (err) {
                console.error(err);
                console.log(`[${rjcode}] 尝试通过parent作品获取动态元数据失败`);
            }
        }
        if (data && !data.rate_average_2dp && data.translation_info && data.translation_info.parent_workno) {
            const parentWorkno = data.translation_info.parent_workno;
            const url = `${dynamicUrlPrefix}${parentWorkno}`;
            const response = await (0, axios_1.retryGet)(url, { retry: {} });
            response.data = (0, utils_1.decryptDataIfNeed)(response.data, globalKeyAndIv);
            data.rate_average_2dp = response.data[parentWorkno].rate_average_2dp || 0.0;
        }
        const work = {
            dl_count: data.dl_count ? data.dl_count : "0",
            rate_average_2dp: data.rate_average_2dp ? data.rate_average_2dp : 0.0,
            rate_count: data.rate_count ? data.rate_count : 0,
            rate_count_detail: data.rate_count_detail,
            review_count: data.review_count,
            price: data.price,
            rank: undefined,
            translation_lang: null,
            original_work_id: null,
        };
        const translation_info = await scrapeTranslationInfoFromDLsite(id, staticUrlPrefix);
        Object.assign(work, translation_info);
        if (data.rank.length) {
            work.rank = data.rank;
        }
        console.log(`[${rjcode}] 成功从 ${dynamicUrlPrefix} 抓取Dynamic元数据...`);
        return work;
    }
    catch (error) {
        if (error.response) {
            throw new Error(`Couldn't request work page HTML (${url}), received: ${error.response.status}.`);
        }
        else {
            throw error;
        }
    }
}
async function scrapeTranslationInfoFromDLsite(id, staticUrlPrefix) {
    const rjcode = (0, idConverter_1.idNumberToCode)(id);
    const work = { original_work_id: id, translation_lang: null };
    const jsonApiUrl = `${staticUrlPrefix}${rjcode}`;
    try {
        const response = await (0, axios_1.retryGet)(jsonApiUrl, { retry: {} });
        response.data = (0, utils_1.decryptDataIfNeed)(response.data, globalKeyAndIv);
        const info = response.data[0];
        if (info.translation_info.is_original) {
            return work;
        }
        const original_workno = response.data[0].translation_info.original_workno;
        work.original_work_id = (0, idConverter_1.codeToIdNumber)(original_workno);
        work.translation_lang = info.translation_info.lang;
        return work;
    }
    catch {
        console.error(`从 ${staticUrlPrefix} 获取原始作品id失败`);
    }
    return work;
}
async function scrapeWorkMetadataFromDLsite(id, language, scrapeType, dynamicUrlPrefix, staticUrlPrefix) {
    const dynamicData = await scrapeDynamicWorkMetadataFromDLsite(id, dynamicUrlPrefix, staticUrlPrefix);
    const betterLocaleLangForTitle = translationLangToLocaleLang(dynamicData.translation_lang, language);
    const staticData = await scrapeStaticWorkMetadataFromDLsite(id, betterLocaleLangForTitle, scrapeType, staticUrlPrefix);
    if (staticData.id != dynamicData.original_work_id) {
        const originalStaticData = await scrapeStaticWorkMetadataFromDLsite(dynamicData.original_work_id, betterLocaleLangForTitle, scrapeType, staticUrlPrefix);
        staticData.circle = originalStaticData.circle;
    }
    const work = Object.assign({}, staticData, dynamicData);
    return work;
}
;
async function scrapeCoverIdForTranslatedWorkFromDLsite(rjcode, language, staticUrlPrefixList) {
    try {
        for (const staticUrlPrefix of staticUrlPrefixList) {
            const jsonApiUrl = `${staticUrlPrefix}${rjcode}`;
            const response = await (0, axios_1.retryGet)(jsonApiUrl, { retry: {} });
            response.data = (0, utils_1.decryptDataIfNeed)(response.data, globalKeyAndIv);
            const original_workno = response.data[0]?.translation_info?.original_workno;
            if (original_workno) {
                console.log(`[${rjcode}] original_workno作品为${original_workno}, 尝试从该作品获取封面`);
                return {
                    coverFromCode: original_workno,
                    isNoImgMain: false,
                };
            }
        }
    }
    catch (err) {
        console.log("尝试获取作品的original＿workno失败", err);
    }
    console.log("尝试获取作品封面id失败，仍然以原始id尝试获取封面");
    return {
        coverFromCode: rjcode,
        isNoImgMain: false,
    };
}
