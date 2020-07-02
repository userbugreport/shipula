"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.flatten = void 0;
// tslint:disable:no-console
const child_process_1 = require("child_process");
/**
 * Flattens a nested object
 *
 * @param object the object to be flattened
 * @returns a flat object with path as keys
 */
function flatten(object) {
    return Object.assign({}, ...function _flatten(child, path = []) {
        return [].concat(...Object.keys(child)
            .map(key => typeof child[key] === 'object' && child[key] !== null
            ? _flatten(child[key], path.concat([key]))
            : ({ [path.concat([key]).join('.')]: child[key] })));
    }(object));
}
exports.flatten = flatten;
/**
 * Decodes encoded true/false values
 */
function decodeBooleans(object) {
    return JSON.parse(JSON.stringify(object), (_k, v) => {
        switch (v) {
            case 'TRUE:BOOLEAN':
                return true;
            case 'FALSE:BOOLEAN':
                return false;
            default:
                return v;
        }
    });
}
/**
 * Filters the keys of an object.
 */
function filterKeys(object, pred) {
    return Object.entries(object)
        .reduce((acc, [k, v]) => pred(k)
        ? { ...acc, [k]: v }
        : acc, {});
}
let latestSdkInstalled = false;
/**
 * Installs latest AWS SDK v2
 */
function installLatestSdk() {
    console.log('Installing latest AWS SDK v2');
    // Both HOME and --prefix are needed here because /tmp is the only writable location
    child_process_1.execSync('HOME=/tmp npm install aws-sdk@2 --production --no-package-lock --no-save --prefix /tmp');
    latestSdkInstalled = true;
}
/* eslint-disable @typescript-eslint/no-require-imports, import/no-extraneous-dependencies */
async function handler(event, context) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _l, _m, _o, _p;
    try {
        let AWS;
        if (!latestSdkInstalled) {
            try {
                installLatestSdk();
                AWS = require('/tmp/node_modules/aws-sdk');
            }
            catch (e) {
                console.log(`Failed to install latest AWS SDK v2: ${e}`);
                AWS = require('aws-sdk'); // Fallback to pre-installed version
            }
        }
        else {
            AWS = require('/tmp/node_modules/aws-sdk');
        }
        if (process.env.USE_NORMAL_SDK) { // For tests only
            AWS = require('aws-sdk');
        }
        console.log(JSON.stringify(event));
        console.log('AWS SDK VERSION: ' + AWS.VERSION);
        // Default physical resource id
        let physicalResourceId;
        switch (event.RequestType) {
            case 'Create':
                physicalResourceId = (_j = (_f = (_c = (_b = (_a = event.ResourceProperties.Create) === null || _a === void 0 ? void 0 : _a.physicalResourceId) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : (_e = (_d = event.ResourceProperties.Update) === null || _d === void 0 ? void 0 : _d.physicalResourceId) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : (_h = (_g = event.ResourceProperties.Delete) === null || _g === void 0 ? void 0 : _g.physicalResourceId) === null || _h === void 0 ? void 0 : _h.id) !== null && _j !== void 0 ? _j : event.LogicalResourceId;
                break;
            case 'Update':
            case 'Delete':
                physicalResourceId = (_o = (_m = (_l = event.ResourceProperties[event.RequestType]) === null || _l === void 0 ? void 0 : _l.physicalResourceId) === null || _m === void 0 ? void 0 : _m.id) !== null && _o !== void 0 ? _o : event.PhysicalResourceId;
                break;
        }
        let flatData = {};
        let data = {};
        const call = event.ResourceProperties[event.RequestType];
        if (call) {
            const awsService = new AWS[call.service]({
                apiVersion: call.apiVersion,
                region: call.region,
            });
            try {
                const response = await awsService[call.action](call.parameters && decodeBooleans(call.parameters)).promise();
                flatData = {
                    apiVersion: awsService.config.apiVersion,
                    region: awsService.config.region,
                    ...flatten(response),
                };
                data = call.outputPath
                    ? filterKeys(flatData, k => k.startsWith(call.outputPath))
                    : flatData;
            }
            catch (e) {
                if (!call.ignoreErrorCodesMatching || !new RegExp(call.ignoreErrorCodesMatching).test(e.code)) {
                    throw e;
                }
            }
            if ((_p = call.physicalResourceId) === null || _p === void 0 ? void 0 : _p.responsePath) {
                physicalResourceId = flatData[call.physicalResourceId.responsePath];
            }
        }
        await respond('SUCCESS', 'OK', physicalResourceId, data);
    }
    catch (e) {
        console.log(e);
        await respond('FAILED', e.message || 'Internal Error', context.logStreamName, {});
    }
    function respond(responseStatus, reason, physicalResourceId, data) {
        const responseBody = JSON.stringify({
            Status: responseStatus,
            Reason: reason,
            PhysicalResourceId: physicalResourceId,
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            NoEcho: false,
            Data: data,
        });
        console.log('Responding', responseBody);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const parsedUrl = require('url').parse(event.ResponseURL);
        const requestOptions = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'PUT',
            headers: { 'content-type': '', 'content-length': responseBody.length },
        };
        return new Promise((resolve, reject) => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const request = require('https').request(requestOptions, resolve);
                request.on('error', reject);
                request.write(responseBody);
                request.end();
            }
            catch (e) {
                reject(e);
            }
        });
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0QkFBNEI7QUFDNUIsaURBQXlDO0FBR3pDOzs7OztHQUtHO0FBQ0gsU0FBZ0IsT0FBTyxDQUFDLE1BQWM7SUFDcEMsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUNsQixFQUFFLEVBQ0YsR0FBRyxTQUFTLFFBQVEsQ0FBQyxLQUFVLEVBQUUsT0FBaUIsRUFBRTtRQUNsRCxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQzthQUNuQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FDVCxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxRQUFRLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUk7WUFDbkQsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDMUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQ3JELENBQUMsQ0FBQztJQUNQLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FDVixDQUFDO0FBQ0osQ0FBQztBQVpELDBCQVlDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGNBQWMsQ0FBQyxNQUFjO0lBQ3BDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2xELFFBQVEsQ0FBQyxFQUFFO1lBQ1QsS0FBSyxjQUFjO2dCQUNqQixPQUFP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O1NBQ3ZFLENBQUM7UUFFRixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3JDLElBQUk7Z0JBQ0YsaUVBQWlFO2dCQUNqRSxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDbEUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzVCLE9BQU8sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQzVCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUNmO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1YsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ1g7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7QUFDSCxDQUFDO0FBN0dELDBCQTZHQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlOm5vLWNvbnNvbGVcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyBBd3NTZGtDYWxsIH0gZnJvbSAnLi4vYXdzLWN1c3RvbS1yZXNvdXJjZSc7XG5cbi8qKlxuICogRmxhdHRlbnMgYSBuZXN0ZWQgb2JqZWN0XG4gKlxuICogQHBhcmFtIG9iamVjdCB0aGUgb2JqZWN0IHRvIGJlIGZsYXR0ZW5lZFxuICogQHJldHVybnMgYSBmbGF0IG9iamVjdCB3aXRoIHBhdGggYXMga2V5c1xuICovXG5leHBvcnQgZnVuY3Rpb24gZmxhdHRlbihvYmplY3Q6IG9iamVjdCk6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0ge1xuICByZXR1cm4gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICAuLi5mdW5jdGlvbiBfZmxhdHRlbihjaGlsZDogYW55LCBwYXRoOiBzdHJpbmdbXSA9IFtdKTogYW55IHtcbiAgICAgIHJldHVybiBbXS5jb25jYXQoLi4uT2JqZWN0LmtleXMoY2hpbGQpXG4gICAgICAgIC5tYXAoa2V5ID0+XG4gICAgICAgICAgdHlwZW9mIGNoaWxkW2tleV0gPT09ICdvYmplY3QnICYmIGNoaWxkW2tleV0gIT09IG51bGxcbiAgICAgICAgICAgID8gX2ZsYXR0ZW4oY2hpbGRba2V5XSwgcGF0aC5jb25jYXQoW2tleV0pKVxuICAgICAgICAgICAgOiAoeyBbcGF0aC5jb25jYXQoW2tleV0pLmpvaW4oJy4nKV06IGNoaWxkW2tleV0gfSksXG4gICAgICAgICkpO1xuICAgIH0ob2JqZWN0KSxcbiAgKTtcbn1cblxuLyoqXG4gKiBEZWNvZGVzIGVuY29kZWQgdHJ1ZS9mYWxzZSB2YWx1ZXNcbiAqL1xuZnVuY3Rpb24gZGVjb2RlQm9vbGVhbnMob2JqZWN0OiBvYmplY3QpIHtcbiAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob2JqZWN0KSwgKF9rLCB2KSA9PiB7XG4gICAgc3dpdGNoICh2KSB7XG4gICAgICBjYXNlICdUUlVFOkJPT0xFQU4nOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgJ0ZBTFNFOkJPT0xFQU4nOlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gIH0pO1xufVxuXG4vKipcbiAqIEZpbHRlcnMgdGhlIGtleXMgb2YgYW4gb2JqZWN0LlxuICovXG5mdW5jdGlvbiBmaWx0ZXJLZXlzKG9iamVjdDogb2JqZWN0LCBwcmVkOiAoa2V5OiBzdHJpbmcpID0+IGJvb2xlYW4pIHtcbiAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKG9iamVjdClcbiAgICAucmVkdWNlKFxuICAgICAgKGFjYywgW2ssIHZdKSA9PiBwcmVkKGspXG4gICAgICAgID8geyAuLi5hY2MsIFtrXTogdiB9XG4gICAgICAgIDogYWNjLFxuICAgICAge30sXG4gICAgKTtcbn1cblxubGV0IGxhdGVzdFNka0luc3RhbGxlZCA9IGZhbHNlO1xuXG4vKipcbiAqIEluc3RhbGxzIGxhdGVzdCBBV1MgU0RLIHYyXG4gKi9cbmZ1bmN0aW9uIGluc3RhbGxMYXRlc3RTZGsoKTogdm9pZCB7XG4gIGNvbnNvbGUubG9nKCdJbnN0YWxsaW5nIGxhdGVzdCBBV1MgU0RLIHYyJyk7XG4gIC8vIEJvdGggSE9NRSBhbmQgLS1wcmVmaXggYXJlIG5lZWRlZCBoZXJlIGJlY2F1c2UgL3RtcCBpcyB0aGUgb25seSB3cml0YWJsZSBsb2NhdGlvblxuICBleGVjU3luYygnSE9NRT0vdG1wIG5wbSBpbnN0YWxsIGF3cy1zZGtAMiAtLXByb2R1Y3Rpb24gLS1uby1wYWNrYWdlLWxvY2sgLS1uby1zYXZlIC0tcHJlZml4IC90bXAnKTtcbiAgbGF0ZXN0U2RrSW5zdGFsbGVkID0gdHJ1ZTtcbn1cblxuLyogZXNsaW50LWRpc2FibGUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0cywgaW1wb3J0L25vLWV4dHJhbmVvdXMtZGVwZW5kZW5jaWVzICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVdTTGFtYmRhLkNsb3VkRm9ybWF0aW9uQ3VzdG9tUmVzb3VyY2VFdmVudCwgY29udGV4dDogQVdTTGFtYmRhLkNvbnRleHQpIHtcbiAgdHJ5IHtcbiAgICBsZXQgQVdTOiBhbnk7XG4gICAgaWYgKCFsYXRlc3RTZGtJbnN0YWxsZWQpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGluc3RhbGxMYXRlc3RTZGsoKTtcbiAgICAgICAgQVdTID0gcmVxdWlyZSgnL3RtcC9ub2RlX21vZHVsZXMvYXdzLXNkaycpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhgRmFpbGVkIHRvIGluc3RhbGwgbGF0ZXN0IEFXUyBTREsgdjI6ICR7ZX1gKTtcbiAgICAgICAgQVdTID0gcmVxdWlyZSgnYXdzLXNkaycpOyAvLyBGYWxsYmFjayB0byBwcmUtaW5zdGFsbGVkIHZlcnNpb25cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgQVdTID0gcmVxdWlyZSgnL3RtcC9ub2RlX21vZHVsZXMvYXdzLXNkaycpO1xuICAgIH1cblxuICAgIGlmIChwcm9jZXNzLmVudi5VU0VfTk9STUFMX1NESykgeyAvLyBGb3IgdGVzdHMgb25seVxuICAgICAgQVdTID0gcmVxdWlyZSgnYXdzLXNkaycpO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGV2ZW50KSk7XG4gICAgY29uc29sZS5sb2coJ0FXUyBTREsgVkVSU0lPTjogJyArIEFXUy5WRVJTSU9OKTtcblxuICAgIC8vIERlZmF1bHQgcGh5c2ljYWwgcmVzb3VyY2UgaWRcbiAgICBsZXQgcGh5c2ljYWxSZXNvdXJjZUlkOiBzdHJpbmc7XG4gICAgc3dpdGNoIChldmVudC5SZXF1ZXN0VHlwZSkge1xuICAgICAgY2FzZSAnQ3JlYXRlJzpcbiAgICAgICAgcGh5c2ljYWxSZXNvdXJjZUlkID0gZXZlbnQuUmVzb3VyY2VQcm9wZXJ0aWVzLkNyZWF0ZT8ucGh5c2ljYWxSZXNvdXJjZUlkPy5pZCA/P1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5SZXNvdXJjZVByb3BlcnRpZXMuVXBkYXRlPy5waHlzaWNhbFJlc291cmNlSWQ/LmlkID8/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LlJlc291cmNlUHJvcGVydGllcy5EZWxldGU/LnBoeXNpY2FsUmVzb3VyY2VJZD8uaWQgPz9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuTG9naWNhbFJlc291cmNlSWQ7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnVXBkYXRlJzpcbiAgICAgIGNhc2UgJ0RlbGV0ZSc6XG4gICAgICAgIHBoeXNpY2FsUmVzb3VyY2VJZCA9IGV2ZW50LlJlc291cmNlUHJvcGVydGllc1tldmVudC5SZXF1ZXN0VHlwZV0/LnBoeXNpY2FsUmVzb3VyY2VJZD8uaWQgPz8gZXZlbnQuUGh5c2ljYWxSZXNvdXJjZUlkO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBsZXQgZmxhdERhdGE6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcbiAgICBsZXQgZGF0YTogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHt9O1xuICAgIGNvbnN0IGNhbGw6IEF3c1Nka0NhbGwgfCB1bmRlZmluZWQgPSBldmVudC5SZXNvdXJjZVByb3BlcnRpZXNbZXZlbnQuUmVxdWVzdFR5cGVdO1xuXG4gICAgaWYgKGNhbGwpIHtcbiAgICAgIGNvbnN0IGF3c1NlcnZpY2UgPSBuZXcgKEFXUyBhcyBhbnkpW2NhbGwuc2VydmljZV0oe1xuICAgICAgICBhcGlWZXJzaW9uOiBjYWxsLmFwaVZlcnNpb24sXG4gICAgICAgIHJlZ2lvbjogY2FsbC5yZWdpb24sXG4gICAgICB9KTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhd3NTZXJ2aWNlW2NhbGwuYWN0aW9uXShjYWxsLnBhcmFtZXRlcnMgJiYgZGVjb2RlQm9vbGVhbnMoY2FsbC5wYXJhbWV0ZXJzKSkucHJvbWlzZSgpO1xuICAgICAgICBmbGF0RGF0YSA9IHtcbiAgICAgICAgICBhcGlWZXJzaW9uOiBhd3NTZXJ2aWNlLmNvbmZpZy5hcGlWZXJzaW9uLCAvLyBGb3IgdGVzdCBwdXJwb3NlczogY2hlY2sgaWYgYXBpVmVyc2lvbiB3YXMgY29ycmVjdGx5IHBhc3NlZC5cbiAgICAgICAgICByZWdpb246IGF3c1NlcnZpY2UuY29uZmlnLnJlZ2lvbiwgLy8gRm9yIHRlc3QgcHVycG9zZXM6IGNoZWNrIGlmIHJlZ2lvbiB3YXMgY29ycmVjdGx5IHBhc3NlZC5cbiAgICAgICAgICAuLi5mbGF0dGVuKHJlc3BvbnNlKSxcbiAgICAgICAgfTtcbiAgICAgICAgZGF0YSA9IGNhbGwub3V0cHV0UGF0aFxuICAgICAgICAgID8gZmlsdGVyS2V5cyhmbGF0RGF0YSwgayA9PiBrLnN0YXJ0c1dpdGgoY2FsbC5vdXRwdXRQYXRoISkpXG4gICAgICAgICAgOiBmbGF0RGF0YTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKCFjYWxsLmlnbm9yZUVycm9yQ29kZXNNYXRjaGluZyB8fCAhbmV3IFJlZ0V4cChjYWxsLmlnbm9yZUVycm9yQ29kZXNNYXRjaGluZykudGVzdChlLmNvZGUpKSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2FsbC5waHlzaWNhbFJlc291cmNlSWQ/LnJlc3BvbnNlUGF0aCkge1xuICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQgPSBmbGF0RGF0YVtjYWxsLnBoeXNpY2FsUmVzb3VyY2VJZC5yZXNwb25zZVBhdGhdO1xuICAgICAgfVxuICAgIH1cblxuICAgIGF3YWl0IHJlc3BvbmQoJ1NVQ0NFU1MnLCAnT0snLCBwaHlzaWNhbFJlc291cmNlSWQsIGRhdGEpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5sb2coZSk7XG4gICAgYXdhaXQgcmVzcG9uZCgnRkFJTEVEJywgZS5tZXNzYWdlIHx8ICdJbnRlcm5hbCBFcnJvcicsIGNvbnRleHQubG9nU3RyZWFtTmFtZSwge30pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzcG9uZChyZXNwb25zZVN0YXR1czogc3RyaW5nLCByZWFzb246IHN0cmluZywgcGh5c2ljYWxSZXNvdXJjZUlkOiBzdHJpbmcsIGRhdGE6IGFueSkge1xuICAgIGNvbnN0IHJlc3BvbnNlQm9keSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIFN0YXR1czogcmVzcG9uc2VTdGF0dXMsXG4gICAgICBSZWFzb246IHJlYXNvbixcbiAgICAgIFBoeXNpY2FsUmVzb3VyY2VJZDogcGh5c2ljYWxSZXNvdXJjZUlkLFxuICAgICAgU3RhY2tJZDogZXZlbnQuU3RhY2tJZCxcbiAgICAgIFJlcXVlc3RJZDogZXZlbnQuUmVxdWVzdElkLFxuICAgICAgTG9naWNhbFJlc291cmNlSWQ6IGV2ZW50LkxvZ2ljYWxSZXNvdXJjZUlkLFxuICAgICAgTm9FY2hvOiBmYWxzZSxcbiAgICAgIERhdGE6IGRhdGEsXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZygnUmVzcG9uZGluZycsIHJlc3BvbnNlQm9keSk7XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0c1xuICAgIGNvbnN0IHBhcnNlZFVybCA9IHJlcXVpcmUoJ3VybCcpLnBhcnNlKGV2ZW50LlJlc3BvbnNlVVJMKTtcbiAgICBjb25zdCByZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgIGhvc3RuYW1lOiBwYXJzZWRVcmwuaG9zdG5hbWUsXG4gICAgICBwYXRoOiBwYXJzZWRVcmwucGF0aCxcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICBoZWFkZXJzOiB7ICdjb250ZW50LXR5cGUnOiAnJywgJ2NvbnRlbnQtbGVuZ3RoJzogcmVzcG9uc2VCb2R5Lmxlbmd0aCB9LFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHNcbiAgICAgICAgY29uc3QgcmVxdWVzdCA9IHJlcXVpcmUoJ2h0dHBzJykucmVxdWVzdChyZXF1ZXN0T3B0aW9ucywgcmVzb2x2ZSk7XG4gICAgICAgIHJlcXVlc3Qub24oJ2Vycm9yJywgcmVqZWN0KTtcbiAgICAgICAgcmVxdWVzdC53cml0ZShyZXNwb25zZUJvZHkpO1xuICAgICAgICByZXF1ZXN0LmVuZCgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZWplY3QoZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==