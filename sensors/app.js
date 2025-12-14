import SerialPort from "serialport";
const parsers = SerialPort.parsers;
const parser = new parsers.Readline({ delimiter: "\r\n" });

const port = new SerialPort("/dev/ttyACM0", {
  baudRate: 9600,
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  flowControl: false,
});


export default function getSensorData() {
  port.pipe(parser);

//{"day":"Monday","temperature":21,"humidity":53}

parser.on("data", function (data) {
  const sensorData = JSON.parse(data);
  
  return(sensorData);

  //console.log("day:", sensorData.day);
  //console.log("temperature:", sensorData.temperature);
  //console.log("humidity:", sensorData.humidity);
  });
}

