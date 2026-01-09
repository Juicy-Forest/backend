import { Schema, model } from 'mongoose';

const sensorSchema = new Schema({
    temperature: {
        type: Number
    },
    humidity: {
        type: Number
    },
    soilMoisture: {
        type: Number
    },
    lightIntensity: {
        type: Number
    },
});

const Sensor = model("Sensor", sensorSchema);
export default Sensor;