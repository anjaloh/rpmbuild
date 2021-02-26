"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = __importDefault(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const specFile = core.getInput('spec_file');
            let data = fs_1.default.readFileSync(`/github/workspace/SPECS/${specFile}`, 'utf8');
            let name = '';
            let version = '';
            for (let lines of data.split('\n')) {
                let lineArray = lines.split(/[ ]+/);
                if (lineArray[0].includes('Name')) {
                    name = lineArray[1].toString();
                }
                if (lineArray[0].includes('Version')) {
                    version = lineArray[1].toString();
                }
            }
            core.debug(`Package Name: ${name}`);
            core.debug(`Package Version: ${version}`);
            yield exec.exec('rpmdev-setuptree');
            yield exec.exec(`cp /github/workspace/SPECS/${specFile} /github/home/rpmbuild/SPECS/`);
            yield exec.exec(`cp -R /github/workspace/SOURCES/. /github/home/rpmbuild/SOURCES/`);
            yield exec.exec(`spectool --get-files --directory /github/home/rpmbuild/SOURCES --all /github/home/rpmbuild/SPECS/${specFile}`);
            yield exec.exec(`dnf builddep -y /github/home/rpmbuild/SPECS/${specFile}`);
            try {
                yield exec.exec(`rpmbuild -ba /github/home/rpmbuild/SPECS/${specFile}`);
            }
            catch (err) {
                core.setFailed(`rpmbuild failed: ${err}`);
            }
            yield exec.exec('tree /github/home/rpmbuild');
            let outputSRPM = '';
            child_process_1.default.exec('ls /github/home/rpmbuild/SRPMS/', (err, stdout, stderr) => {
                if (err) {
                    core.error(`Error getting output SRPM: ${err}`);
                }
                else {
                    outputSRPM = stdout.trim();
                    core.debug(`stdout: ${stdout}`);
                    core.debug(`stderr: ${stderr}`);
                }
            });
            let outputRPM = '';
            child_process_1.default.exec('ls /github/home/rpmbuild/RPMS/x86_64/', (err, stdout, stderr) => {
                if (err) {
                    core.error(`Error getting output RPM: ${err}`);
                }
                else {
                    outputRPM = stdout.trim();
                    core.debug(`stdout: ${stdout}`);
                    core.debug(`stderr: ${stderr}`);
                }
            });
            yield exec.exec('mkdir -p rpmbuild/SRPMS');
            yield exec.exec('mkdir -p rpmbuild/RPMS');
            yield exec.exec(`cp /github/home/rpmbuild/SRPMS/${outputSRPM} rpmbuild/SRPMS`);
            child_process_1.default.exec('cp -R /github/home/rpmbuild/RPMS/. rpmbuild/RPMS/');
            yield exec.exec('ls -la rpmbuild/SRPMS');
            yield exec.exec('ls -la rpmbuild/RPMS/x86_64');
            core.setOutput('rpm_path', `rpmbuild/RPMS/x86_64/${outputRPM}`); // Paths to the RPM package
            core.setOutput('rpm_name', `${outputRPM}`); // Name of the RPM package
            core.setOutput('srpm_path', `rpmbuild/SRPMS/${outputSRPM};`); // Paths to the Source RPM package
            core.setOutput('srpm_name', `${outputSRPM};`); // Name of the Source RPM package
            core.setOutput('content_type', 'application/octet-stream'); // Content-type for the upload
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
