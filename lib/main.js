"use strict";
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
const core_1 = __importDefault(require("@actions/core"));
const exec_1 = __importDefault(require("@actions/exec"));
// import github from '@actions/github';
const child_process_1 = __importDefault(require("child_process"));
const fs_1 = __importDefault(require("fs"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // const context = github.context;
            // const owner = context.repo.owner;
            // const repo = context.repo.repo;
            // const ref = context.ref;
            const specFilePath = core_1.default.getInput('spec_file_path');
            let data = fs_1.default.readFileSync(specFilePath, 'utf8');
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
            console.log(`Package Name: ${name}`);
            console.log(`Package Version: ${version}`);
            yield exec_1.default.exec('rpmdev-setuptree');
            yield exec_1.default.exec(`/github/workspace/${specFilePath} /github/home/rpmbuild/SPECS/`);
            yield exec_1.default.exec(`spectool --get-files --all /github/home/rpmbuild/SPECS/${specFilePath}`);
            yield exec_1.default.exec(`dnf builddep -y github/home/rpmbuild/SPECS/${specFilePath}`);
            try {
                yield exec_1.default.exec(`rpmbuild -ba github/home/rpmbuild/SPECS/${specFilePath}`);
            }
            catch (err) {
                core_1.default.setFailed(`rpmbuild failed: ${err}`);
            }
            yield exec_1.default.exec('tree /github/home/rpmbuild');
            let outputSRPM = '';
            child_process_1.default.exec('ls /github/home/rpmbuild/SRPMS/', (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                }
                else {
                    outputSRPM = stdout.trim();
                    console.log(`stdout: ${stdout}`);
                    console.log(`stderr: ${stderr}`);
                }
            });
            yield exec_1.default.exec('mkdir -p rpmbuild/SRPMS');
            yield exec_1.default.exec('mkdir -p rpmbuild/RPMS');
            yield exec_1.default.exec(`cp /github/home/rpmbuild/SRPMS/${outputSRPM} rpmbuild/SRPMS`);
            child_process_1.default.exec('cp -R /github/home/rpmbuild/RPMS/. rpmbuild/RPMS/');
            yield exec_1.default.exec('ls -la rpmbuild/SRPMS');
            yield exec_1.default.exec('ls -la rpmbuild/RPMS');
            core_1.default.setOutput('source_rpm_dir_path', `rpmbuild/SRPMS/`); // Path to SRPMS directory
            core_1.default.setOutput('source_rpm_path', `rpmbuild/SRPMS/${outputSRPM}`); // Path to Source RPM file
            core_1.default.setOutput('source_rpm_name', `${outputSRPM}`); // Name of Source RPM file
            core_1.default.setOutput('rpm_dir_path', `rpmbuild/RPMS/`); // Path to RPMS directory
            core_1.default.setOutput('rpm_content_type', 'application/octet-stream'); // Content-type for Upload
        }
        catch (error) {
            core_1.default.setFailed(error.message);
        }
    });
}
run();
