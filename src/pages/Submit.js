import React, {useEffect, useState} from "react";
import { Link } from 'react-router-dom';
// import '../styles/Home.css';
import { useLocation } from "react-router-dom";
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

const libraries = ['places'];
let counter = 0;

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
};

const calculateScore = (distance) => {
    const normalizedDistance = Math.min(distance / 20000, 1); // Assuming 20,000 km as the maximum distance for the lowest score
    const score = 500 * (1 - normalizedDistance);
    return Math.round(score);
};

const SubmitPage = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const mapPosition = JSON.parse(searchParams.get("mapPosition"));
    const markerPosition = JSON.parse(searchParams.get("markerPosition"));
    const [city, setCity] = useState("");
    const [currMapPosition, setMapPosition] = useState(null);
    const [currMarkerPosition, setMarkerPosition] = useState(null);
    const [timeoutSet, setTimeoutSet] = useState(false);
    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    useEffect(() => {
        if (!mapPosition || !markerPosition) {
            return (
                <div>
                    <button className="button">
                        <Link to="/geography-guessr/game">Play Again</Link>
                        Play Again
                    </button><br></br><br></br>
                    <button className="button">
                        <Link to="/geography-guessr">Go Home</Link>
                    </button>
                </div>
            );
        }
    }, [mapPosition, markerPosition]);

    // if (mapPosition == null) {
    //     return (
    //         <div>
    //             <button className="button">
    //                 <Link to="/geography-guessr/game">Play Again</Link>
    //                 Play Again
    //             </button><br></br><br></br>
    //             <button className="button">
    //                 <Link to="/geography-guessr">Go Home</Link>
    //             </button>
    //         </div>
    //     );
    // }

    const distance = calculateDistance(mapPosition.lat, mapPosition.lng, markerPosition.lat, markerPosition.lng);
    const score = calculateScore(distance);

    const mapContainerStyle = {
        width: '100vw',
        height: '70vh',
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${mapPosition.lat},${mapPosition.lng}&key=AIzaSyCPHDPxo1GLqPj_HpZFagVMZ1jnEAZttkY`
                );
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                const addressComponents = data.results[0].address_components;
                for (let component of addressComponents) {
                    if (component.types.includes("locality")) {
                        setCity(component.long_name);
                        break;
                    }
                }
                }
            } catch (error) {
                console.error("Error fetching city:", error);
            }
        };
    
        fetchData();
    }, [mapPosition.lat, mapPosition.lng]);

    useEffect(() => {
        if (!timeoutSet) {
            const timer = setInterval(() => {
                if (counter < 2) {
                    setMapPosition(mapPosition);
                    setMarkerPosition(markerPosition);
                    counter++;
                } else {
                    clearInterval(timer);
                    setTimeoutSet(true);
                }
            }, 1000);
        
            return () => clearInterval(timer);
        }
    }, [timeoutSet, mapPosition, markerPosition]);

    if (loadError) {
        return <div>Error loading maps</div>;
    }

    if (!isLoaded) {
        return <div>Loading maps</div>;
    }

    return (
        <div className="Submit">

            <GoogleMap
                mapContainerStyle={mapContainerStyle} // Set map container to fill its parent
                zoom={2}
                center={mapPosition}
            >
                {currMapPosition && <Marker position={currMapPosition} />}
                {currMarkerPosition && <Marker position={currMarkerPosition} />}
            </GoogleMap>

            <div>City: {city}</div>
            <h3>Score</h3>
            <p>{score}</p>
            <button className="button">
                <Link to="/geography-guessr/game">Play Again</Link>
            </button><br></br><br></br>
            <button className="button">
                <Link to="/geography-guessr">Go Home</Link>
            </button>
        </div>
    );
};

export default SubmitPage;
