import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from 'react-router-dom';
import { GoogleMap, useLoadScript, Marker, Polyline } from '@react-google-maps/api';
import { calculateDistance, calculateScore } from '../scoring';

const libraries = ['places'];

const mapContainerStyle = {
    width: '100vw',
    height: '70vh',
};

// Module-level so its identity never changes. As an inline literal it was a new
// object on every render, and the geocoder's setCity re-render made the library
// re-apply it -- throwing away the fitBounds and leaving both markers off-screen.
const RESULT_MAP_OPTIONS = { disableDefaultUI: true };

const parsePosition = (raw) => {
    try {
        const parsed = JSON.parse(raw);
        return typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number' ? parsed : null;
    } catch {
        return null;
    }
};

const SubmitPage = () => {
    const location = useLocation();
    const { mapPosition, markerPosition, difficulty } = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return {
            mapPosition: parsePosition(params.get("mapPosition")),
            markerPosition: parsePosition(params.get("markerPosition")),
            difficulty: params.get("difficulty") || 'medium',
        };
    }, [location.search]);

    const [city, setCity] = useState("");
    const [map, setMap] = useState(null);
    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    // Geocoder comes from the SDK useLoadScript already pulled in -- no second API key.
    useEffect(() => {
        if (!isLoaded || !mapPosition) return;
        new window.google.maps.Geocoder().geocode({ location: mapPosition }, (results, status) => {
            if (status !== 'OK' || !results?.length) return;
            const locality = results[0].address_components.find((c) => c.types.includes("locality"));
            setCity(locality ? locality.long_name : results[0].formatted_address);
        });
    }, [isLoaded, mapPosition]);

    // Framing lives in its own effect keyed on the map + the round, so unrelated
    // re-renders (city arriving) can't disturb it.
    useEffect(() => {
        if (!map || !mapPosition) return;
        if (!markerPosition) {
            map.setCenter(mapPosition);
            map.setZoom(5);
            return;
        }
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(mapPosition);
        bounds.extend(markerPosition);
        map.fitBounds(bounds, 80);
    }, [map, mapPosition, markerPosition]);

    if (loadError) {
        return <div>Error loading maps</div>;
    }

    if (!isLoaded) {
        return <div>Loading maps</div>;
    }

    if (!mapPosition) {
        return (
            <div>
                <div>No round to show.</div><br />
                <button className="button">
                    <Link to="/geography-guessr/game">Play Again</Link>
                </button><br /><br />
                <button className="button">
                    <Link to="/geography-guessr">Go Home</Link>
                </button>
            </div>
        );
    }

    const distance = markerPosition
        ? calculateDistance(mapPosition.lat, mapPosition.lng, markerPosition.lat, markerPosition.lng)
        : null;
    const score = markerPosition ? calculateScore(distance, difficulty) : 0;

    return (
        <div className="Submit">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                options={RESULT_MAP_OPTIONS}
                onLoad={setMap}
            >
                <Marker position={mapPosition} />
                {markerPosition && (
                    <>
                        <Marker position={markerPosition} />
                        <Polyline
                            path={[mapPosition, markerPosition]}
                            options={{ strokeColor: '#4CAF50', strokeOpacity: 0.8, strokeWeight: 3 }}
                        />
                    </>
                )}
            </GoogleMap>

            <div>City: {city}</div>
            {markerPosition
                ? <div>You were {Math.round(distance).toLocaleString()} km away</div>
                : <div>Out of time — no guess</div>}
            {/* Modes score on different curves, so say which one this was. */}
            <h3>Score ({difficulty})</h3>
            <p>{score}</p>
            <button className="button">
                <Link to={`/geography-guessr/game?difficulty=${difficulty}`}>Play Again</Link>
            </button><br /><br />
            <button className="button">
                <Link to="/geography-guessr">Go Home</Link>
            </button>
        </div>
    );
};

export default SubmitPage;
