import { ManagerClient } from './ManagerClient';
import { Message } from '../../types/Message';
import { MessageError, MessageHosts, MessageType } from '../../common/HostTrackerMessage';
import { ACTION } from '../../common/Action';
import { DeviceTracker as GoogDeviceTracker } from '../googDevice/client/DeviceTracker'; //安卓库
import { DeviceTracker as ApplDeviceTracker } from '../applDevice/client/DeviceTracker'; //apple库
import { ParamsBase } from '../../types/ParamsBase';
import { HostItem } from '../../types/Configuration';
import { ChannelCode } from '../../common/ChannelCode';

const TAG = '[HostTracker]';

export interface HostTrackerEvents {
    // hosts: HostItem[];
    disconnected: CloseEvent;
    error: string;
}

export class HostTracker extends ManagerClient<ParamsBase, HostTrackerEvents> {
    private static instance?: HostTracker;

    public static start(): void {
        console.log("src/app/client/HostTracker.ts=>start");
        this.getInstance();
    }

    public static getInstance(): HostTracker {
        if (!this.instance) {
            //new 一个HostTracker 对象
            this.instance = new HostTracker();
        }
        return this.instance;
    }

    //存储设备数据
    private trackers: Array<GoogDeviceTracker | ApplDeviceTracker> = [];

    constructor() {
        console.log("src/app/client/HostTracker.ts=>constructor");
        super({ action: ACTION.LIST_HOSTS });
        this.openNewConnection(); //执行src\app\client\HostTracker.ts的openNewConnection
        if (this.ws) {
            this.ws.binaryType = 'arraybuffer';
        }
    }

    protected onSocketClose(ev: CloseEvent): void {
        console.log("src/app/client/HostTracker.ts=>onSocketClose");
        console.log(TAG, 'WS closed');
        this.emit('disconnected', ev);
    }

    protected onSocketMessage(event: MessageEvent): void {
        console.log("src/app/client/HostTracker.ts=>onSocketMessage");
        let message: Message;
        try {
            // TODO: rewrite to binary
            message = JSON.parse(event.data);
        } catch (error: any) {
            console.error(TAG, error.message);
            console.log(TAG, error.data);
            return;
        }
        switch (message.type) {
            case MessageType.ERROR: {
                const msg = message as MessageError;
                console.error(TAG, msg.data);
                this.emit('error', msg.data);
                break;
            }
            case MessageType.HOSTS: {
                const msg = message as MessageHosts;
                // this.emit('hosts', msg.data);
                if (msg.data.local) {
                    msg.data.local.forEach(({ type }) => {
                        const secure = location.protocol === 'https:';
                        const port = location.port ? parseInt(location.port, 10) : secure ? 443 : 80;
                        const { hostname } = location;
                        if (type !== 'android' && type !== 'ios') {
                            console.warn(TAG, `Unsupported host type: "${type}"`);
                            return;
                        }
                        // {hostname: "localhost",port: 8000,secure: false,type: "android",useProxy: false}
                        const hostItem: HostItem = { useProxy: false, secure, port, hostname, type };
                        this.startTracker(hostItem);
                    });
                }
                if (msg.data.remote) {
                    msg.data.remote.forEach((item) => this.startTracker(item));
                }
                break;
            }
            default:
                console.log(TAG, `Unknown message type: ${message.type}`);
        }
    }

    private startTracker(hostItem: HostItem): void {
        console.log("src/app/client/HostTracker.ts=>startTracker");
        //调用不同的类库
        switch (hostItem.type) {
            case 'android':
                this.trackers.push(GoogDeviceTracker.start(hostItem));
                break;
            case 'ios':
                this.trackers.push(ApplDeviceTracker.start(hostItem));
                break;
            default:
                console.warn(TAG, `Unsupported host type: "${hostItem.type}"`);
        }
        console.log("src/app/client/=>startTracker->this.trackers",this.trackers);
    }

    protected onSocketOpen(): void {
        // do nothing
    }

    public destroy(): void {
        console.log("src/app/client/HostTracker.ts=>destroy");
        super.destroy();
        this.trackers.forEach((tracker) => {
            tracker.destroy();
        });
        this.trackers.length = 0;
    }

    protected supportMultiplexing(): boolean {
        return true;
    }

    protected getChannelInitData(): Buffer {
        console.log("src/app/client/HostTracker.ts=>getChannelInitData");
        const buffer = Buffer.alloc(4);
        buffer.write(ChannelCode.HSTS, 'ascii');
        return buffer;
    }
}
