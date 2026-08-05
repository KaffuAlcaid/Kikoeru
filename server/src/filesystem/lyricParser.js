"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLrc = parseLrc;
exports.parseSrtOrVtt = parseSrtOrVtt;
function parseLrc(textContent, isRemoveBlankLine = true) {
    const timeFieldExp = /^\[((\d+):)?(\d+):(\d+)\.(\d+)\]/;
    const lines = textContent
        .split(/\r\n|\n|\r/)
        .map((line) => line.trim())
        .map((line) => {
        let timeMatch = timeFieldExp.exec(line);
        if (!timeMatch)
            return null;
        const text = line.replace(timeFieldExp, '').trim();
        if (!text && isRemoveBlankLine)
            return null;
        const hour = timeMatch[2] === undefined ? 0 : parseInt(timeMatch[2]);
        const minute = parseInt(timeMatch[3]);
        const seconds = parseInt(timeMatch[4]);
        const hundredSeconds = parseInt(timeMatch[5]);
        return {
            time: hour * 60 * 60 * 1000 + minute * 60 * 1000 + seconds * 1000 + hundredSeconds * 10,
            text,
            extLrc: [],
        };
    })
        .filter((line) => line !== null);
    lines.sort((a, b) => {
        return a.time - b.time;
    });
    return lines;
}
function parseSrtOrVtt(text) {
    let lines = text.split("\n").map((l) => l.trim());
    let isVtt = lines[0] == 'WEBVTT';
    if (isVtt) {
        lines = lines.slice(1);
    }
    const timeParseRe = /((\d*):)?(\d*):(\d*)(\.|,)(\d*)\s*-->\s*((\d*):)?(\d*):(\d*)(\.|,)(\d*)/;
    const numberRe = /^\d*$/;
    const chunks = [[]];
    lines.forEach((line) => {
        if (line !== "") {
            chunks[chunks.length - 1].push(line);
        }
        else {
            chunks.push([]);
        }
    });
    const parsedLines = chunks
        .filter(c => c.length > 0)
        .map(c => {
        if (numberRe.test(c[0])) {
            c = c.slice(1);
        }
        const parseResult = timeParseRe.exec(c[0]);
        if (!parseResult)
            return null;
        const [, , sh, sm, ss, , sms, , eh, em, es, _sep2, ems] = parseResult;
        const time = parseInt(sh || '0') * 60 * 60 * 1000 + parseInt(sm) * 60 * 1000 + parseInt(ss) * 1000 + parseInt(sms);
        const timeEnd = parseInt(eh || '0') * 60 * 60 * 1000 + parseInt(em) * 60 * 1000 + parseInt(es) * 1000 + parseInt(ems);
        const text = c.slice(1).join("\n");
        return {
            time,
            timeEnd,
            text,
            extLrc: [],
        };
    })
        .filter(c => c !== null);
    return parsedLines;
}
