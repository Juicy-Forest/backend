const express = require('express')
const sensorData = require('./app.js')
const { default: getSensorData } = require('./app.js')
const app = express()
const port = 3000


app.get('/sensor-data', (req, res) => {
  res.send(getSensorData())
})

app.get('/sensor-humidity', (req, res) => {
  res.send(sensorData.humidity)
})
app.get('/sensor-day', (req, res) => {
  res.send(sensorData.day)
})
app.get('/sensor-temperature', (req, res) => {
  res.send(sensorData.temperature)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
