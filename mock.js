const mockjs = require("mockjs");
const Jinan_builds = require("./GIS_DATA/Jinan_builds.json")
const Jinan_roads = require("./GIS_DATA/Jinan_roads.json")
const Jinan_livepoints = require("./GIS_DATA/Jinan_livepoints.json")
const Jinan_line = require("./GIS_DATA/Jinan_line.json")
const Jinan_lpointc = require("./GIS_DATA/Jinan_lpointc.json")
const Jinan_highline = require("./GIS_DATA/Jinan_highline.json")
const Jinan_bus_lines = require("./GIS_DATA/Jinan_bus_lines.json")
const Jinan_bus_stops = require("./GIS_DATA/Jinan_bus_stops.json")
const Jinan_metro_stations = require("./GIS_DATA/Jinan_metro_stations.json")

module.exports = () => {
      return mockjs.mock({
        Jinan_builds,
        Jinan_roads,
        Jinan_livepoints,
        Jinan_line,
        Jinan_lpointc,
        Jinan_highline,
        Jinan_bus_lines,
        Jinan_bus_stops,
        Jinan_metro_stations
      })
}