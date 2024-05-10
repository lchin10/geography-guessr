let panorama, map;
let marker = null;

//////////////////////////// CODE FROM https://randomstreetview.com/ //////////////////////////////

var ranges = [], ResultStreetview, hLimit, hLimitOrig, hRange, hCountry, hCycleLimit, shareActive, currCenter;
var client;

geocoder = new google.maps.Geocoder();
client = new google.maps.StreetViewService();

//define 

function randBetween(z1, z2, z3, z4) {
	var lat = z3 + (Math.random() * (z1-z3));
	var lng = z2 + (Math.random() * (z4-z2));
	return [lat, lng];

}

var hCycles = 0;
var timeIncr = 1;

function preload() {

	var rangeStr = ranges[Math.round(Math.random()*(ranges.length-1))];
	if (rangeStr == '') {
		preload();
		return;
	}
	var range = rangeStr.split(',');
    var randomLocation = randBetween(parseFloat(range[0]), parseFloat(range[1]), parseFloat(range[2]), parseFloat(range[3]));
	var loc = new google.maps.LatLng(randomLocation[0],randomLocation[1]);
	client.getPanoramaByLocation(loc , hRange, function(result, status) {
		if (status == google.maps.StreetViewStatus.OK) {
			ResultStreetview = result;
			geocoder.geocode({'latLng': result.location.latLng}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					if (results[0]) {
						// Lookup country
						var countryCode = '';
						for (var i=0; i<results[0].address_components.length; i++) {
	                    	for (var b=0;b<results[0].address_components[i].types.length;b++) {
		                    	if (results[0].address_components[i].types[b] == "country") {
		                        	countryCode = results[0].address_components[i].short_name.toLowerCase();  
		                        	countryName = results[0].address_components[i].long_name;  
		                        	break;
		                    	}
  							}
                    	}
                    	log(countryCode);
						
                    	if (jQuery.inArray(countryCode, hCountry) >= 0 || hCountry[0] == ''){
							locations.push([ResultStreetview.location.latLng.lat(), ResultStreetview.location.latLng.lng(), results[0].formatted_address, countryCode, countryName]);
						} else {
							hLimit--;
						}

						if (locations.length == hLimit) {
							sendToServer(locations);
						}
						
					} else preload();
				} else {
					log ('Google says ' + status);
					setTimeout(preload, (250 * (timeIncr + 0.1)));
				}
			});
		} else preload();
	});
};

///////////////////////////////////////////////////////////////////////////////////

let position = { lat: 0, lng: 0 };
// var client = new google.maps.StreetViewService();

// function getRandomLoc() {
//     //random lat lng
//     const randomLat = (Math.random() * 180) - 90;
//     const randomLng = (Math.random() * 360) - 180;

//     client.getPanorama({ location: position, radius: 50 }, (data, status) => {
//         if (status === google.maps.StreetViewStatus.OK) {
//             return { lat: randomLat, lng: randomLng };
//         } else {
//             getRandomLoc();
//         }
//     });

//     return {}
// }

// function getStreetView() {
//     position = getRandomLoc();
//     panorama = new google.maps.StreetViewPanorama(
//         document.getElementById("street-view"),
//         {
//             position: position,
//             pov: { heading: 165, pitch: 0 },
//             zoom: 1,
//         },
//     );
// }

function initialize() {

    // getStreetView();

    panorama = new google.maps.StreetViewPanorama(
        document.getElementById("street-view"),
        {
            position: position,
            pov: { heading: 165, pitch: 0 },
            zoom: 1,
        },
    );
  
    map = new google.maps.Map(document.getElementById("map"), {
        center: position,
        zoom: 1,
    });

    // Configure the click listener.
    map.addListener("click", (mapsMouseEvent) => {
        // Close the current InfoWindow.
        // infoWindow.close();
        // Create a new InfoWindow.
        // document.getElementById("lat").innerHTML = mapsMouseEvent.latLng;
        const { lat, lng } = mapsMouseEvent.latLng.toJSON();
        if (marker) {
            marker.setMap(null);
        }
        marker = new google.maps.Marker({
            map: map,
            position: mapsMouseEvent.latLng,
        });

        document.getElementById("lat").innerHTML = lat;
        document.getElementById("long").innerHTML = lng;
    });

}

window.initialize = initialize;


function startButton() {
    overlayOn();
}

function overlayOn() {
    document.getElementById("overlay").style.display = "block";
}

function overlayOff() {
    document.getElementById("overlay").style.display = "none";
}