import path = require('path');
import sign = require('ios-signing-common/ios-signing-common');
import secureFilesCommon = require('securefiles-common/securefiles-common');
import tl = require('vsts-task-lib/task');
import os = require('os');

import { ToolRunner } from 'vsts-task-lib/toolrunner';

async function run() {
    let secureFileId: string;
    let secureFileHelpers: secureFilesCommon.SecureFileHelpers;

    try {
        tl.setResourcePath(path.join(__dirname, 'task.json'));

        // Check platform is macOS since demands are not evaluated on Hosted pools
        if (os.platform() !== 'darwin') {
            throw new Error(tl.loc('InstallRequiresMac'));
        }

        if (tl.getInput('provisioningProfileLocation') === 'sourceRepository') {
            let provProfilePath: string = tl.getInput('provProfileSourceRepository', true);

            if (tl.filePathSupplied('provProfileSourceRepository') && tl.exist(provProfilePath) && tl.stats(provProfilePath).isFile()) {
                const info = await sign.installProvisioningProfile(provProfilePath);
                if (info && info.provProfileUUID) {
                    tl.setTaskVariable('APPLE_PROV_PROFILE_UUID', info.provProfileUUID.trim());

                    // set the provisioning profile output variable.
                    tl.setVariable('provisioningProfileUuid', info.provProfileUUID.trim());
                    // Set the legacy variable that doesn't use the task's refName, unlike our output variables.
                    // If there are multiple InstallAppleCertificate tasks, the last one wins.
                    tl.setVariable('APPLE_PROV_PROFILE_UUID', info.provProfileUUID.trim());
                }

                if (info && info.provProfileName) {
                    tl.setVariable('provisioningProfileName', info.provProfileName.trim());
                }

            } else {
                throw tl.loc('InputProvisioningProfileNotFound', provProfilePath);
            }
        }

    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    }
}

run();