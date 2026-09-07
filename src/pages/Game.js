import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import '../styles/Game.css';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import DinoGame from './dino/Dino';
import { EASY_SEEDS } from '../locations';

const libraries = ['places'];

// Letting Street View snap to the nearest road within 50 km is what makes random
// sampling viable at all -- the API defaults to a 50 m radius, which almost never hits.
const SEARCH_RADIUS_M = 50000;
const BATCH_SIZE = 5;
const MAX_BATCHES = 12;
const HARD_TIME_LIMIT = 5 * 60; // seconds

// Module-level so its identity never changes: @react-google-maps/api re-applies
// `options` whenever the object changes, which would fight the player's panning.
const GUESS_MAP_OPTIONS = {
    center: { lat: 20, lng: 0 },
    zoom: 1,
    disableDefaultUI: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
};

const START_POV = { heading: 100, pitch: 0 };

const sampleLocation = (difficulty) => {
    if (difficulty === 'easy') {
        const [lat, lng] = EASY_SEEDS[Math.floor(Math.random() * EASY_SEEDS.length)];
        return { lat: lat + (Math.random() - 0.5) * 0.06, lng: lng + (Math.random() - 0.5) * 0.06 };
    }
    // Clamped to [-60, 75]: Antarctica and the high Arctic have no coverage at all.
    return { lat: Math.random() * 135 - 60, lng: Math.random() * 360 - 180 };
};

const tryOnce = (difficulty) => new Promise((resolve, reject) => {
    const service = new window.google.maps.StreetViewService();
    service.getPanorama(
        {
            location: sampleLocation(difficulty),
            radius: SEARCH_RADIUS_M,
            source: window.google.maps.StreetViewSource.OUTDOOR,
        },
        (data, status) => {
            // Resolve the whole location: we need the pano id, not just coordinates.
            if (status === 'OK') {
                resolve(data.location);
            } else {
                reject(status);
            }
        }
    );
});

// A batch of candidates in flight at once; first hit wins. Bounded, unlike the
// old while(true) loop.
const findLocation = async (difficulty) => {
    for (let i = 0; i < MAX_BATCHES; i++) {
        try {
            return await Promise.any(
                Array.from({ length: BATCH_SIZE }, () => tryOnce(difficulty))
            );
        } catch (e) {
            // whole batch missed (AggregateError) -- sample again
        }
    }
    throw new Error('no panorama found');
};

// Mounted for the whole game, including while we're still looking for a location.
// The Maps API lazy-loads its Street View renderer the first time a panorama is
// constructed, so building one here lets that module download behind the loading
// screen. Construct without a pano, then assign it -- a panorama built and pointed at a
// location in one go on a fresh page load paints black, because the renderer isn't
// there yet. The old code hid this by calling setOptions on every single render.
const StreetViewWrapper = ({ panoId, panoRef }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!panoRef.current) {
            panoRef.current = new window.google.maps.StreetViewPanorama(ref.current, {
                pov: START_POV,
                zoom: 1,
                visible: true,
                streetViewControl: false,
                showRoadLabels: false,
                zoomControl: false,
                fullscreenControl: false,
                addressControl: false,
            });
        }
        // Built once on purpose: re-applying options is what teleported the player
        // back to the drop point every time the mini-map re-rendered.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!panoId || !panoRef.current) return;
        panoRef.current.setPano(panoId);
        panoRef.current.setPov(START_POV);
        // The loading overlay just came off; make sure it measured the final container.
        const raf = requestAnimationFrame(() =>
            window.google.maps.event.trigger(panoRef.current, 'resize'));
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [panoId]);

    return <div ref={ref} className="street-view" />;
};

const GamePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const difficulty = ['easy', 'medium', 'hard'].includes(searchParams.get('difficulty'))
        ? searchParams.get('difficulty')
        : 'medium';

    const [panoId, setPanoId] = useState(null);
    const [markerPosition, setMarkerPosition] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(HARD_TIME_LIMIT);
    const panoRef = useRef(null);
    const startRef = useRef(null);      // answer coordinates, for scoring
    const startPanoRef = useRef(null);  // pano id of the drop point, for Reset

    const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    useEffect(() => {
        if (!isLoaded || loadError) return;
        let cancelled = false;

        findLocation(difficulty)
            .then((loc) => {
                if (cancelled) return;
                // Coordinates are the answer for scoring; the id is what we render.
                startRef.current = { lat: loc.latLng.lat(), lng: loc.latLng.lng() };
                startPanoRef.current = loc.pano;
                setPanoId(loc.pano);
                setIsLoading(false);
            })
            .catch(() => {
                if (!cancelled) setError("Couldn't find a location. Try again.");
            });

        return () => { cancelled = true; };
    }, [isLoaded, loadError, difficulty]);

    const submit = useCallback((guess) => {
        navigate(`/geography-guessr/result?mapPosition=${JSON.stringify(startRef.current)}`
            + `&markerPosition=${JSON.stringify(guess)}`
            + `&difficulty=${difficulty}`);
    }, [navigate, difficulty]);

    // Hard mode only: count down, then submit whatever guess is on the board (if any).
    useEffect(() => {
        if (difficulty !== 'hard' || isLoading) return;
        const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timer);
    }, [difficulty, isLoading]);

    useEffect(() => {
        if (difficulty === 'hard' && !isLoading && timeLeft === 0) submit(markerPosition);
    }, [difficulty, isLoading, timeLeft, markerPosition, submit]);

    const resetStreetView = () => {
        if (!panoRef.current) return;
        panoRef.current.setPano(startPanoRef.current);
        panoRef.current.setPov(START_POV);
    };

    const handleMapClick = (e) => setMarkerPosition(e.latLng.toJSON());

    if (loadError) {
        return <div>Error loading maps</div>;
    }

    if (!isLoaded) {
        return <div>Loading maps</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="Game">
            <div className="map-container">
                <StreetViewWrapper panoId={panoId} panoRef={panoRef} />
                {isLoading && (
                    <div className="loading-overlay">
                        <MapLoader />
                        <div>Press the space bar to start the mini-game</div>
                        <DinoGame />
                    </div>
                )}
                {!isLoading && (
                    <button className="reset-street-view" onClick={resetStreetView}>Reset Street View</button>
                )}
                {!isLoading && difficulty === 'hard' && (
                    <div className="timer">
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                    </div>
                )}

                <div className="button-container">
                    <button className="back-button" onClick={() => { window.location.href = '/geography-guessr'; }}>Go back to home</button>
                </div>

                <div className="submit-location">
                    <div className="location-pick">
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            options={GUESS_MAP_OPTIONS}
                            onClick={handleMapClick}
                        >
                            {markerPosition && <Marker position={markerPosition} />}
                        </GoogleMap>
                    </div>

                    {markerPosition && (
                        <button className="submit-button" onClick={() => submit(markerPosition)}>Submit</button>
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
