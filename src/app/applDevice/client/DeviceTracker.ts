import { BaseDeviceTracker } from '../../client/BaseDeviceTracker';
import { ACTION } from '../../../common/Action';
import ApplDeviceDescriptor from '../../../types/ApplDeviceDescriptor';
import Util from '../../Util';
import { html } from '../../ui/HtmlTag';
import { DeviceState } from '../../../common/DeviceState';
import { HostItem } from '../../../types/Configuration';
import { ChannelCode } from '../../../common/ChannelCode';
import { Tool } from '../../client/Tool';

//DeviceTracker  继承自BaseDeviceTracker
export class DeviceTracker extends BaseDeviceTracker<ApplDeviceDescriptor, never> {
    public static ACTION = ACTION.APPL_DEVICE_LIST;
    protected static tools: Set<Tool> = new Set();
    private static instancesByUrl: Map<string, DeviceTracker> = new Map();

    public static start(hostItem: HostItem): DeviceTracker {
        console.log("src\app\applDevice\client\DeviceTracker.ts=>start");
        const url = this.buildUrlForTracker(hostItem).toString();
        let instance = this.instancesByUrl.get(url);
        if (!instance) {
            instance = new DeviceTracker(hostItem, url);
        }
        return instance;
    }

    public static getInstance(hostItem: HostItem): DeviceTracker {
        return this.start(hostItem);
    }
    protected tableId = 'appl_devices_list';
    constructor(params: HostItem, directUrl: string) {
        console.log("src\app\applDevice\client\DeviceTracker.ts=>constructor");
        super({ ...params, action: DeviceTracker.ACTION }, directUrl);
        DeviceTracker.instancesByUrl.set(directUrl, this);
        this.buildDeviceTable();
        this.openNewConnection();
    }

    protected onSocketOpen(): void {
        // do nothing;
    }
  //构建deviceRow，一个设备一行
    protected buildDeviceRow(tbody: Element, device: ApplDeviceDescriptor): void {
        console.log("src\app\applDevice\client\DeviceTracker.ts=>buildDeviceRow");
      
        const blockClass = 'desc-block';
        const fullName = `${this.id}_${Util.escapeUdid(device.udid)}`;
        const isActive = device.state === DeviceState.CONNECTED;
        const servicesId = `device_services_${fullName}`;
        const row = html`<div class="device ${isActive ? 'active' : 'not-active'}">
            <div class="device-header">
                <div class="device-name">"${device.name}"</div>
                <div class="device-model">${device.model}</div>
                <div class="device-serial">${device.udid}</div>
                <div class="device-version">
                    <div class="release-version">${device.version}</div>
                </div>
                <div class="device-state" title="State: ${device.state}"></div>
            </div>
            <div id="${servicesId}" class="services"></div>
        </div>`.content;
        const services = row.getElementById(servicesId);
        if (!services) {
            return;
        }

        //把注册工具，shell devtools  listfiles 放入 工具div#device_services_XXXXXX
        DeviceTracker.tools.forEach((tool) => {
            const entry = tool.createEntryForDeviceList(device, blockClass, this.params);
            if (entry) {
                if (Array.isArray(entry)) {
                    entry.forEach((item) => {
                        item && services.appendChild(item);
                    });
                } else {
                    services.appendChild(entry);
                }
            }
            console.log("src\app\applDevice\client\DeviceTracker.ts=> tool.entry");
        });
        tbody.appendChild(row);
    }

    protected getChannelCode(): string {
        return ChannelCode.ATRC;
    }
}
