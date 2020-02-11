//const sucks = require('sucks');
const sucks = require('./../index');
const nodeMachineId = require('node-machine-id');
const EcoVacsAPI = sucks.EcoVacsAPI;
const VacBot = sucks.VacBot;

const email = "email@domain.com";
const password = "a1b2c3d4";
const countrycode = 'DE';

const password_hash = EcoVacsAPI.md5(password);
const device_id = EcoVacsAPI.md5(nodeMachineId.machineIdSync());
const countries = sucks.countries;
const continent = countries[countrycode].continent.toLowerCase();
console.log(continent);

const api = new EcoVacsAPI(device_id, countrycode, continent);
api.connect(email, password_hash).then(() => {
    api.devices().then((devices) => {
        let vacuum = devices[0];
        console.log(vacuum);
        let vacbot = new VacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);
        vacbot.on('ready', (event) => {
            console.log('vacbot ready');

            vacbot.on('ChargeState', (state) => {
                console.log('[app2.js] ChargeState: ' + state);
            });
            vacbot.on('FanSpeed', (speed) => {
                console.log('[app2.js] FanSpeed: ' + speed);
            });
            vacbot.on('CleanState', (state) => {
                console.log('[app2.js] CleanState: ' + state);
            });
            vacbot.on('BatteryInfo', (batterystatus) => {
                let battery = Math.round(batterystatus * 100);
                console.log('[app2.js] BatteryInfo: ' + battery);
            });
            vacbot.on('LifeSpan_filter', (level) => {
                console.log('[app2.js] filter: ' + Math.round(level));
            });
            vacbot.on('LifeSpan_main_brush', (level) => {
                console.log('[app2.js] main_brush: ' + Math.round(level));
            });
            vacbot.on('LifeSpan_side_brush', (level) => {
                console.log('[app2.js] side_brush: ' + Math.round(level));
            });
            // MQTT
            vacbot.on('message', (event) => {
                console.log('[app2.js] message: ' + event);
            });
        });
        vacbot.connect_and_wait_until_ready();

        console.log('[app2.js] isKnownDevice: ' + vacbot.isKnownDevice());
        console.log('[app2.js] isSupportedDevice: ' + vacbot.isSupportedDevice());
        console.log('[app2.js] name: ' + vacbot.getDeviceProperty('name'));
        console.log('[app2.js] hasMainBrush: ' + vacbot.hasMainBrush());
        console.log('[app2.js] hasSpotAreas: ' + vacbot.hasSpotAreas());
        console.log('[app2.js] hasCustomAreas: ' + vacbot.hasCustomAreas());
        console.log('[app2.js] hasMoppingSystem: ' + vacbot.hasMoppingSystem());
        console.log('[app2.js] hasVoiceReports: ' + vacbot.hasVoiceReports());

        if (!vacbot.useMqtt) {
            vacbot.run('Clean');
            vacbot.run('GetLifeSpan', 'main_brush');
            vacbot.run('GetLifeSpan', 'side_brush');
            vacbot.run('GetLifeSpan', 'filter');
            let interval = setInterval(() => {
                vacbot.run('GetCleanState');
                vacbot.run('GetChargeState');
                vacbot.run('GetBatteryState');
            }, 15000);
        }
    });
}).catch((e) => {
    console.log('Failure in connecting: ', e.message);
});