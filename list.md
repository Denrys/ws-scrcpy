
src/app/index.ts  为入口

注册引入registerTool 插件
执行HostTracker.start()，在执行执行

src/app/client/HostTracker.ts=>start
 src/app/client/HostTracker.ts=>constructor
 src/app/client/HostTracker.ts=>getChannelInitData
 src/app/client/HostTracker.ts=>onSocketMessage
 src/app/client/HostTracker.ts=>startTracker

 srcappgoogDeviceclientDeviceTracker.ts=>start
src/app/client/BaseDeviceTracker.ts=>buildUrlForTracker
 srcappgoogDeviceclientDeviceTracker.ts=>constructor
 src/app/client/BaseDeviceTracker.ts=>constructor
 src/app/client/BaseDeviceTracker.ts=>buildDeviceTable
 src/app/client/HostTracker.ts=>startTracker->this.trackers [t]
 src/app/client/BaseDeviceTracker.ts=>buildDeviceTable
 srcappgoogDeviceclientDeviceTracker.ts=>buildDeviceRow