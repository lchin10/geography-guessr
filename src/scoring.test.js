import { calculateDistance, calculateScore } from './scoring';

test('haversine distance', () => {
    // NYC -> London is about 5570 km
    expect(calculateDistance(40.7128, -74.006, 51.5074, -0.1278)).toBeCloseTo(5570, -2);
    expect(calculateDistance(10, 20, 10, 20)).toBe(0);
});

test('score decays with distance', () => {
    expect(calculateScore(0)).toBe(5000);
    expect(calculateScore(25)).toBeGreaterThan(4800);
    expect(calculateScore(400)).toBeGreaterThan(3500);
    expect(calculateScore(20000)).toBe(0);
});
