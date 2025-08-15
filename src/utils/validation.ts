// Common non-city words that might appear in the data
const NON_CITY_WORDS = [
    'region', 'district', 'province', 'state', 'county',
    'republic', 'kingdom', 'unknown', 'test', 'example',
    'n/a', 'null', 'undefined', ''
];

// Common city suffixes
const CITY_SUFFIXES = [
    'city', 'town', 'ville', 'burg', 'berg', 'ford',
    'field', 'ton', 'port', 'mouth', 'land', 'side'
];

function validateCity(city: { name: string; country: string; }) {
    if (!city || !city.name || !city.country) {
        return false;
    }

    const name = city.name.toLowerCase().trim();
    const country = city.country.toLowerCase().trim();

    // Check for empty or invalid values
    if (NON_CITY_WORDS.includes(name) || NON_CITY_WORDS.includes(country)) {
        return false;
    }

    // Check if name looks like a city (contains city suffix or is not a single word)
    const hasCitySuffix = CITY_SUFFIXES.some(suffix => name.endsWith(suffix));
    const hasMultipleWords = name.includes(' ') || name.includes('-');

    return hasCitySuffix || hasMultipleWords;
}

module.exports = {
    validateCity
};