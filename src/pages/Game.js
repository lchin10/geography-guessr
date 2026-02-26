import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import '../styles/Game.css';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import Streetview from 'react-google-streetview';
import DinoGame from './dino/Dino';

const libraries = ['places'];
let tempCenter = {lat: 0, lng: 0};

const getRandomValidLocation = async () => {
    // Generate random latitude and longitude within the valid range (-90 to 90 for latitude, -180 to 180 for longitude)
    const randomLat = Math.random() * (90 * 2) - 90;
    const randomLng = Math.random() * (180 * 2) - 180;

    // Check if the random location has a Street View panorama
    const service = new window.google.maps.StreetViewService();
    const panorama = await new Promise((resolve, reject) => {
        service.getPanorama({ location: { lat: randomLat, lng: randomLng } }, (data, status) => {
            if (status === 'OK') {
                resolve(data.location.latLng);
            } else {
                reject();
            }
        });
    });

    // Return the valid location
    return panorama;
};

const GamePage = () => {
    const navigate = useNavigate(); // Use useNavigate instead of useHistory
    const [isHovered, setIsHovered] = useState(false);
    const [center, setCenter] = useState(null);
    const [newCenter, setNewCenter] = useState(null);
    const [markerPosition, setMarkerPosition] = useState(null);
    const [showSubmitButton, setShowSubmitButton] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const mapDim = isHovered ? 50 : 20;
    const mapContainerStyle = {
        width: mapDim.toString() + 'vw',
        height: mapDim.toString() + 'vh',
    };

    useEffect(() => {
        const fetchRandomLocation = async () => {
            let validLocation = null;
            while (!validLocation) {
                try {
                    const location = await getRandomValidLocation();
                    validLocation = location;
                } catch (error) {
                    console.error('Error fetching random valid location:', error);
                }
            }
            setCenter({ lat: validLocation.lat(), lng: validLocation.lng() });
            tempCenter = { lat: validLocation.lat(), lng: validLocation.lng() };
            setIsLoading(false);
        };
    
        if (isLoaded && !loadError) {
            fetchRandomLocation();
        }
    }, [isLoaded, loadError]);

    const setStreetViewPosition = () => {
        setNewCenter(tempCenter);

        setTimeout(() => {
            setNewCenter(null);
        }, 2000);
    };

    const handleMapClick = (e) => {
        const clickedLatLng = e.latLng.toJSON();
        setMarkerPosition(clickedLatLng);
        setShowSubmitButton(true);
    };

    const handleSubmit = () => {
        navigate(`/geography-guessr/result?mapPosition=${JSON.stringify(center)}&markerPosition=${JSON.stringify(markerPosition)}`);
    };

    if (loadError) {
        return <div>Error loading maps</div>;
    }

    if (!isLoaded) {
        return <div>Loading maps</div>;
    }

    return (
        <div className="Game">
            <div className="map-container">
                {isLoading && <MapLoader />}
                {isLoading && <div>Press the space bar to start the mini-game</div>}
                {isLoading && <DinoGame />}
                {!isLoading && (
                    <Streetview
                        apiKey={GOOGLE_MAPS_API_KEY}
                        streetViewPanoramaOptions={{
                            position: newCenter || center,
                            pov: { heading: 100, pitch: 0 },
                            zoom: 1,
                            streetViewControl: false,
                            showRoadLabels: false,
                            zoomControl: false,
                            fullscreenControl: false,
                            addressControl: false
                        }}
                    />
                )}
                {!isLoading && (
                    <button className="reset-street-view" onClick={setStreetViewPosition}>Reset Street View</button>
                )}

                <div className="button-container">
                    <button className="back-button" onClick={() => { window.location.href = '/geography-guessr'; }}>Go back to home</button>
                </div>
                
                <div 
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="submit-location" style={mapContainerStyle}>
                    <div
                        className="location-pick"
                        style={mapContainerStyle} // Apply dynamic width and height
                    >
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }} // Set map container to fill its parent
                            zoom={1}
                            center={markerPosition || { lat: 0, lng: 0 }}
                            onClick={handleMapClick}
                            options={{
                                disableDefaultUI: true,
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: false
                            }}
                        >
                            {markerPosition && <Marker position={markerPosition} />}
                        </GoogleMap>
                    </div>

                    {showSubmitButton && markerPosition && (
                        <button className="submit-button" onClick={handleSubmit}>Submit</button>
                    )}
                </div>
            </div>
        </div>
    );
};

const MapLoader = () => {
    const [dots, setDots] = useState(".");
  
    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prevDots) => {
          if (prevDots === "...") {
            return ".";
          } else {
            return prevDots + ".";
          }
        });
      }, 500);
  
      return () => clearInterval(interval);
    }, []);
  
    return (
      <div className="map-load-container">
        <div className="map-load">Grabbing map{dots}</div>
      </div>
    );
  };

export default GamePage;
