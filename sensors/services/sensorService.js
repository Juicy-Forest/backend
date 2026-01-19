import Sensor from '../models/Sensor.js';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const serialPortPath = process.env.SERIAL_PORT_PATH || '/dev/ttyACM0';

export function startListeningOnSerialPort(websocketBroadcaster) {
    const port = new SerialPort({ path: serialPortPath, baudRate: 9600 });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    port.on('open', () => console.log(`Serial port open on ${serialPortPath}`));
    parser.on('data', async (data) => {
        const parsedData = JSON.parse(data);
        await postSensorData(parsedData);

        if (websocketBroadcaster) {
            websocketBroadcaster(parsedData);
        }
    });
}

export async function getSensorData() {
    return await Sensor.find({});
}

export async function postSensorData(data) {
    return await Sensor.create(data);
}


