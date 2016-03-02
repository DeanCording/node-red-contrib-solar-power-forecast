/**
 * Copyright 2016 Dean Cording <dean@cording.id.au>.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Calculates power output of a solar system under ideal conditions at a specified time.
 * 
 * Solar irradiation calculation source:
 * http://www.pveducation.org/pvcdrom/properties-of-sunlight/solar-radiation-at-earths-surface
 **/

module.exports = function(RED) {
"use strict";
var SunCalc = require("suncalc");

// The main node definition - most things happen in here
function SolarPowerForecastNode(n) {
    // Create a RED node
    RED.nodes.createNode(this,n);

    // Store local copies of the node configuration (as defined in the .html)
    this.lat = n.lat;
    this.lon = n.lon;
    this.tilt = n.tilt * Math.PI / 180; // Convert to radians
    this.orientation = n.orientation * Math.PI / 180;  // Convert to radians
    this.altitude = n.altitude / 1000; // Convert metres to kilometres
    this.area = n.area;
    this.number = n.number;
    this.efficiency = n.efficiency / 100;

    var node = this;

    this.on("input", function(msg) {
      var date = new Date(msg.payload);
      var sunPosition = SunCalc.getPosition(date, node.lat, node.lon);


        // Adjust for suncalc's weird orientation
        if (sunPosition.azimuth > Math.PI) {
          sunPosition.azimuth -= Math.PI;
        } else { 
          sunPosition.azimuth += Math.PI;
        }

	var airMass = -1;
        var directIrradiance = 0;
        var moduleIrradiance = 0;

        if (sunPosition.altitude > 0) {

          airMass = 1 / Math.cos((Math.PI / 2) - sunPosition.altitude);

	  // Direct irradiance on a surface perpendicular to sun's rays
          directIrradiance = 1353 * ((1 - (0.14 * node.altitude)) 
            * Math.pow(0.7,Math.pow(airMass,0.678)) + (0.14 * node.altitude));

          // moduleIrradiance includes direct and diffuse irradiance
          moduleIrradiance = directIrradiance * (Math.cos(sunPosition.altitude) 
            * Math.sin(node.tilt) * Math.cos(node.orientation - sunPosition.azimuth) 
            +  Math.sin(sunPosition.altitude) * Math.cos(node.tilt))
            + (directIrradiance * 0.1 * ((Math.PI - node.tilt) / Math.PI));

	}

      	msg.payload = {timestamp: msg.payload, powerforecast: moduleIrradiance * node.area * node.number * node.efficiency};
      

      // send out the message to the rest of the workspace.
      node.send(msg);
    });

    this.on("close", function() {
        // Called when the node is shutdown - eg on redeploy.
        // Allows ports to be closed, connections dropped etc.
        // eg: this.client.disconnect();
    });
}

// Register the node by name. This must be called before overriding any of the
// Node functions.
RED.nodes.registerType("solar power forecast",SolarIrradianceNode);
}
