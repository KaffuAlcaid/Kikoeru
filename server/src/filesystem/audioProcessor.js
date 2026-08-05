"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.genTranscodeTaskIdentifier = genTranscodeTaskIdentifier;
exports.genTranscodeOutputPath = genTranscodeOutputPath;
exports.genTranscodeTempOutputPath = genTranscodeTempOutputPath;
exports.convertAudioToM4a = convertAudioToM4a;
exports.deleteOldFiles = deleteOldFiles;
exports.calculateLUFS = calculateLUFS;
exports.calculateLUFSSplit = calculateLUFSSplit;
exports.getAudioPeaks = getAudioPeaks;
const path_1 = __importDefault(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const utils_1 = require("./utils");
const lodash_1 = require("lodash");
const tempDir = os_1.default.tmpdir();
function genTranscodeTaskIdentifier(workId, hashIndex, targetBitRate) {
    return `${workId}_${hashIndex}_${targetBitRate}`;
}
function genTranscodeOutputPath(workId, hashIndex, targetBitRate, transcodeOutputDirectory) {
    const transcodeName = `${workId}_${hashIndex}_${targetBitRate}.m4a`;
    return path_1.default.join(transcodeOutputDirectory, transcodeName);
}
function genTranscodeTempOutputPath(transcodeTempOutputDirectory) {
    const transcodeTempName = (0, utils_1.genUniqueRandomName)() + '.m4a';
    return path_1.default.join(transcodeTempOutputDirectory, transcodeTempName);
}
function convertAudioToM4a(inputFile, outputFile, bitRate = 128, onProgress = lodash_1.noop) {
    return new Promise((resolve, reject) => {
        console.log(`transcode(bitRate:${bitRate}kb/s) start`);
        console.log(` input: `, inputFile);
        console.log(` temp output: `, outputFile);
        (0, fluent_ffmpeg_1.default)(inputFile)
            .audioCodec("aac")
            .format('ipod')
            .audioBitrate(bitRate)
            .noVideo()
            .output(outputFile)
            .outputOptions([
            "-movflags frag_keyframe+empty_moov",
        ])
            .on('end', () => {
            console.log('transcode finished');
            resolve();
        })
            .on('progress', (progress) => {
            console.log(` transcoding progress: ${JSON.stringify(progress)}`);
            if (onProgress) {
                onProgress(progress);
            }
        })
            .on('error', (err) => {
            console.error(`转换失败: ${err.message}`);
            reject(err);
        })
            .run();
    });
}
function getFilesWithAccessTime(folder) {
    const files = fs_1.default.readdirSync(folder);
    return files.map((file) => {
        const filePath = path_1.default.join(folder, file);
        const stats = fs_1.default.statSync(filePath);
        return {
            file: file,
            lastAccessTime: stats.atimeMs,
            isFile: stats.isFile(),
        };
    }).filter(item => item.isFile);
}
function deleteOldFiles(folder, maxFiles) {
    console.warn(`清理转码缓存, maxFiles = ${maxFiles}, folder = ${folder}`);
    const files = getFilesWithAccessTime(folder);
    files.sort((a, b) => a.lastAccessTime - b.lastAccessTime);
    const filesToDelete = Math.max(0, files.length - maxFiles);
    for (let i = 0; i < filesToDelete; i++) {
        const filePath = path_1.default.join(folder, files[i].file);
        try {
            fs_1.default.unlinkSync(filePath);
        }
        catch (err) {
            console.log(`Deleted file failed: ${files[i].file}`, err);
        }
        console.log(`Deleted file: ${files[i].file}`);
    }
}
function getAudioDuration(inputPath) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(inputPath, (err, metadata) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(metadata.format.duration);
            }
        });
    });
}
function generateTempDirPath() {
    let tempPath;
    do {
        tempPath = path_1.default.join(tempDir, `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    } while (fs_1.default.existsSync(tempPath));
    return tempPath;
}
function deleteDirRecursive(dirPath) {
    if (fs_1.default.existsSync(dirPath)) {
        const files = fs_1.default.readdirSync(dirPath);
        files.forEach(file => {
            const filePath = path_1.default.join(dirPath, file);
            if (fs_1.default.statSync(filePath).isDirectory()) {
                deleteDirRecursive(filePath);
            }
            else {
                fs_1.default.unlinkSync(filePath);
            }
        });
        fs_1.default.rmdirSync(dirPath);
    }
}
async function calculateLUFS(inputPath) {
    return new Promise((resolve, reject) => {
        const command = (0, fluent_ffmpeg_1.default)(inputPath)
            .audioFilters('loudnorm=print_format=json')
            .format("null")
            .output('-');
        let stderr = '';
        command.on('stderr', (line) => {
            console.log(line);
            stderr += line;
        });
        command.on('end', () => {
            try {
                const jsonStart = stderr.indexOf('{');
                const jsonEnd = stderr.lastIndexOf('}') + 1;
                const jsonString = stderr.slice(jsonStart, jsonEnd);
                const result = JSON.parse(jsonString);
                resolve(result);
            }
            catch (e) {
                reject(new Error(`解析失败: ${e.message}\n原始输出: ${stderr}`));
            }
        });
        command.on('error', reject);
        command.run();
    });
}
async function calculateLUFSSplit(inputPath) {
    const tempDir = generateTempDirPath();
    fs_1.default.mkdirSync(tempDir);
    try {
        const duration = await getAudioDuration(inputPath);
        const one_hour_audio_duration = 60 * 60;
        const half_hour_audio_duration = 30 * 60;
        const splitInterval = duration < half_hour_audio_duration
            ? 30
            : (duration < one_hour_audio_duration
                ? 60
                : 120);
        const splitCountThreshold = 4;
        const middlePickInterval = 10;
        const intervalCount = Math.ceil(duration / splitInterval);
        if (intervalCount < splitCountThreshold) {
            return calculateLUFS(inputPath);
        }
        else {
            const tempFiles = [];
            for (let i = 0; i < intervalCount; i++) {
                const startSeconds = i * splitInterval;
                const startSecond = startSeconds + (splitInterval - middlePickInterval) / 2;
                const endSecond = startSeconds + (splitInterval + middlePickInterval) / 2;
                const actualStart = Math.min(startSecond, duration - 10);
                const actualEnd = Math.min(endSecond, duration);
                console.log(`split segments ${i}: ${actualStart.toFixed(2)} - ${actualEnd.toFixed(2)}`);
                if (actualEnd > actualStart) {
                    const tempFile = path_1.default.join(tempDir, `segment_${i}.wav`);
                    tempFiles.push(tempFile);
                    await new Promise((resolve, reject) => {
                        (0, fluent_ffmpeg_1.default)(inputPath)
                            .inputOptions(['-ss', actualStart.toString()])
                            .inputOptions(['-t', (actualEnd - actualStart).toString()])
                            .output(tempFile)
                            .on('end', () => resolve())
                            .on('error', reject)
                            .run();
                    });
                }
            }
            if (tempFiles.length === 0) {
                return calculateLUFS(inputPath);
            }
            const fileListPath = path_1.default.join(tempDir, 'filelist.txt');
            const fileListContent = tempFiles.map(file => `file '${file}'`).join('\n');
            fs_1.default.writeFileSync(fileListPath, fileListContent);
            const concatenatedFile = path_1.default.join(tempDir, 'concatenated.wav');
            await new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)()
                    .input(fileListPath)
                    .inputOptions(['-f', 'concat'])
                    .inputOptions(['-safe', '0'])
                    .output(concatenatedFile)
                    .on('end', () => resolve())
                    .on('error', reject)
                    .run();
            });
            const result = await calculateLUFS(concatenatedFile);
            return result;
        }
    }
    catch (error) {
        console.error('获取音频时长失败，使用原始计算方法:', error);
        return calculateLUFS(inputPath);
    }
    finally {
        try {
            deleteDirRecursive(tempDir);
        }
        catch (cleanupError) {
            console.error('清理临时文件失败:', cleanupError);
        }
    }
}
function uniformSample(arr, m) {
    if (m >= arr.length)
        return [...arr];
    const step = (arr.length - 1) / (m - 1);
    return Array.from({ length: m }, (_, i) => {
        const index = Math.round(i * step);
        return arr[index];
    });
}
async function getAudioPeaks(inputPath, frameInterval = 20) {
    return new Promise((resolve, reject) => {
        const ptsTimeRegex = /frame:\d+\s*pts:\d+\s*pts_time:([\d.]+)/;
        const peakLeveRegex = /lavfi.astats.Overall.Peak_level=([-\d.inf]+)/;
        const command = (0, fluent_ffmpeg_1.default)(inputPath)
            .complexFilter([
            {
                filter: 'astats',
                options: { metadata: 1, reset: 1 },
                outputs: 'astats'
            },
            {
                filter: 'aselect',
                options: { expr: `not(mod(n,${frameInterval}))` },
                inputs: 'astats',
                outputs: 'aselect'
            },
            {
                filter: 'ametadata',
                options: { mode: 'print', key: 'lavfi.astats.Overall.Peak_level' },
                inputs: 'aselect'
            }
        ])
            .outputOptions('-f', 'null')
            .output('-');
        const datas = [];
        command.on('stderr', (line) => {
            if (!line.includes("Parsed_ametadata")) {
                return;
            }
            let match;
            if ((match = ptsTimeRegex.exec(line)) !== null) {
                datas.push({
                    ptsTime: parseFloat(match[1]),
                    peakLevel: null,
                });
            }
            if ((match = peakLeveRegex.exec(line)) !== null && datas.length > 0) {
                const last = datas[datas.length - 1];
                const level = parseFloat(match[1]);
                if (isFinite(level)) {
                    last.peakLevel = level;
                }
                else {
                    datas.pop();
                }
            }
        });
        command.on('end', () => {
            if (datas.length <= 0) {
                reject(new Error('解析电平水平失败'));
                return;
            }
            let retDatas = datas.filter(e => (isFinite(e.ptsTime) && isFinite(e.peakLevel)));
            const maxSamples = 200;
            if (retDatas.length > maxSamples) {
                retDatas = uniformSample(retDatas, maxSamples);
            }
            resolve(retDatas);
        });
        command.on('error', reject);
        command.run();
    });
}
