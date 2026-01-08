import { jest } from '@jest/globals';

// 1. Define the mocks using unstable_mockModule
// These MUST be at the very top and use dynamic importing for the service
jest.unstable_mockModule('serialport', () => ({
    SerialPort: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        pipe: jest.fn().mockReturnThis(),
    }))
}));

jest.unstable_mockModule('@serialport/parser-readline', () => ({
    ReadlineParser: jest.fn().mockImplementation(() => ({
        on: jest.fn(),
    }))
}));

jest.unstable_mockModule('../models/Sensor.js', () => ({
    default: {
        find: jest.fn(),
        create: jest.fn()
    }
}));

// 2. Dynamically import the modules AFTER the mocks are defined
const { SerialPort } = await import('serialport');
const { ReadlineParser } = await import('@serialport/parser-readline');
const { default: Sensor } = await import('../models/Sensor.js');
const { startListeningOnSerialPort, getSensorData, postSensorData } = await import('../services/sensorService.js');

describe('Sensor Service', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Database operations', () => {
        it('getSensorData should call Sensor.find', async () => {
            const mockData = [{ id: 1, value: 25 }];
            Sensor.find.mockResolvedValue(mockData);

            const result = await getSensorData();

            expect(Sensor.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockData);
        });

        it('postSensorData should call Sensor.create with data', async () => {
            const mockInput = { temperature: 22 };
            Sensor.create.mockResolvedValue(mockInput);

            await postSensorData(mockInput);

            expect(Sensor.create).toHaveBeenCalledWith(mockInput);
        });
    });

    describe('startListeningOnSerialPort', () => {
        it('should initialize the serial port and parser', () => {
            startListeningOnSerialPort(jest.fn());

            expect(SerialPort).toHaveBeenCalledWith(expect.objectContaining({
                baudRate: 9600
            }));
        });

        it('should process data, save to DB, and broadcast via websocket', async () => {
            const mockBroadcaster = jest.fn();
            const dataObj = { temperature: 24, humidity: 50 };
            const rawJsonData = JSON.stringify(dataObj);

            // 1. Trigger the listener setup FIRST
            // This causes the 'new SerialPort()' and 'pipe()' calls to happen
            startListeningOnSerialPort(mockBroadcaster);

            // 2. Now that the instances exist, grab them from the mock history
            const mockPortInstance = SerialPort.mock.results[0].value;
            
            // The parser is the result of mockPort.pipe(...)
            const mockParserInstance = mockPortInstance.pipe.mock.results[0].value;

            // 3. Find the 'data' event handler registered on the parser
            const dataCall = mockParserInstance.on.mock.calls.find(call => call[0] === 'data');
            
            if (!dataCall) {
                throw new Error("Data handler was not registered on the parser");
            }
            
            const dataHandler = dataCall[1];

            // 4. Manually trigger the 'data' event and wait for processing
            await dataHandler(rawJsonData);

            // 5. Assertions
            expect(Sensor.create).toHaveBeenCalledWith(dataObj);
            expect(mockBroadcaster).toHaveBeenCalledWith(dataObj);
        });
    });
});