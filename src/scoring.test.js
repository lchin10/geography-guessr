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

test('medium is the forgiving mode', () => {
    expect(calculateScore(980, 'easy')).toBeLessThan(calculateScore(980, 'medium'));
    expect(calculateScore(980, 'hard')).toBeLessThan(calculateScore(980, 'medium'));
});

test('hard scores the same as easy', () => {
    expect(calculateScore(980, 'hard')).toBe(calculateScore(980, 'easy'));
});

test('right country, wrong end of it still scores well', () => {
    expect(calculateScore(980, 'medium')).toBeGreaterThan(4000); // was 2602
    expect(calculateScore(980, 'hard')).toBeGreaterThan(3500);
});

test('unknown difficulty falls back to medium', () => {
    expect(calculateScore(980, 'nonsense')).toBe(calculateScore(980, 'medium'));
    expect(calculateScore(980)).toBe(calculateScore(980, 'medium'));
});

test('monotonically decreasing', () => {
    const ds = [0, 100, 500, 1000, 2000, 5000, 10000, 20000];
    const scores = ds.map((d) => calculateScore(d, 'medium'));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
});
