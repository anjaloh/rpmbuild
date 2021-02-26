import * as core from '@actions/core';
import * as exec from '@actions/exec';
import cp from 'child_process';
import fs from 'fs';

async function run() {
	try {
		const specFile = core.getInput('spec_file');

		let data = fs.readFileSync(
			`/github/workspace/SPECS/${specFile}`,
			'utf8'
		);
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

		await exec.exec('rpmdev-setuptree');

		await exec.exec(
			`cp /github/workspace/SPECS/${specFile} /github/home/rpmbuild/SPECS/`
		);

		await exec.exec(
			`cp -R /github/workspace/SOURCES/. /github/home/rpmbuild/SOURCES/`
		);

		await exec.exec(
			`spectool --get-files --directory /github/home/rpmbuild/SOURCES --all /github/home/rpmbuild/SPECS/${specFile}`
		);

		await exec.exec(
			`dnf builddep -y /github/home/rpmbuild/SPECS/${specFile}`
		);

		try {
			await exec.exec(
				`rpmbuild -ba /github/home/rpmbuild/SPECS/${specFile}`
			);
		} catch (err) {
			core.setFailed(`rpmbuild failed: ${err}`);
		}

		await exec.exec('tree /github/home/rpmbuild');

		let outputSRPM = '';
		cp.exec('ls /github/home/rpmbuild/SRPMS/', (err, stdout, stderr) => {
			if (err) {
				core.error(`Error getting output SRPM: ${err}`);
			} else {
				outputSRPM = stdout.trim();
				core.debug(`stdout: ${stdout}`);
				core.debug(`stderr: ${stderr}`);
			}
		});

		let outputRPM = '';
		cp.exec('ls /github/home/rpmbuild/RPMS/', (err, stdout, stderr) => {
			if (err) {
				core.error(`Error getting output RPM: ${err}`);
			} else {
				outputRPM = stdout.trim();
				core.debug(`stdout: ${stdout}`);
				core.debug(`stderr: ${stderr}`);
			}
		});

		await exec.exec('mkdir -p rpmbuild/SRPMS');
		await exec.exec('mkdir -p rpmbuild/RPMS');

		await exec.exec(
			`cp /github/home/rpmbuild/SRPMS/${outputSRPM} rpmbuild/SRPMS`
		);
		cp.exec('cp -R /github/home/rpmbuild/RPMS/. rpmbuild/RPMS/');

		await exec.exec('ls -la rpmbuild/SRPMS');
		await exec.exec('ls -la rpmbuild/RPMS/x86_64');

		core.setOutput(
			'asset_paths',
			`rpmbuild/SRPMS/${outputSRPM};rpmbuild/RPMS/x86_64/${outputRPM}`
		); // Paths to RPM and Source RPM files
		core.setOutput('rpm_content_type', 'application/octet-stream'); // Content-type for Upload
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
