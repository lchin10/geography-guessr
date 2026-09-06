export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
};

// Per-mode decay distance. Bigger = more forgiving.
// hard matches easy on purpose: it draws the same random locations as medium and only
// adds a timer, so it gets the demanding curve rather than a forgiveness bonus.
const DECAY_KM = { easy: 2500, medium: 3500, hard: 2500 };

// Exponent >1 flattens the curve near zero and steepens it further out: near-misses
// stay cheap, wrong-continent guesses still collapse. At 1.0 this is the plain
// exponential falloff, which decays fastest exactly where "right country, wrong end
// of it" lands. Lower it toward 1.0 to make scoring harsher again.
const SHAPE = 1.3;

export const calculateScore = (distance, difficulty = 'medium') =>
    Math.round(5000 * Math.exp(-Math.pow(distance / (DECAY_KM[difficulty] ?? DECAY_KM.medium), SHAPE)));
