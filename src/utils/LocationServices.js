class LocationService {

    /**
     * This should be changed to either pull from firebase or something so that this class isn't useless
     */
    static locations = [
        { name: "Thing A", latitude: 40.7128, longitude: -74.006 },
        { name: "Thing B", latitude: 34.0522, longitude: -118.2437 },
        { name: "Thing C", latitude: 41.8781, longitude: -87.6298 },
    ];

    /**
     * Gets the user's current location using the Geolocation API.
     * @returns {Promise<{latitude: number, longitude: number}>}
     */
    static getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser."));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    reject(new Error(error.message));
                }
            );
        });
    }

    /**
     * Calculates the distance between two coordinates using the Haversine formula.
     * @param {{ latitude: number, longitude: number }} coord1 - First coordinate (user's location).
     * @param {{ latitude: number, longitude: number }} coord2 - Second coordinate (a location).
     * @returns {number} Distance in kilometers.
     */
    static getDistance(coord1, coord2) {
        const R = 6371; // Radius of Earth in km
        const dLat = (coord2.latitude - coord1.latitude) * (Math.PI / 180);
        const dLon = (coord2.longitude - coord1.longitude) * (Math.PI / 180);
        const lat1 = coord1.latitude * (Math.PI / 180);
        const lat2 = coord2.latitude * (Math.PI / 180);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in km
    }

    /**
     * Finds the closest location from a list based on the user's coordinates.
     * @param {{ name: string, latitude: number, longitude: number }[]} locations - List of locations.
     * @returns {Promise<{ name: string, latitude: number, longitude: number, distance: number }>}
     */
    static async findNearestLocation(locations) {
        try {
            const userCoords = await this.getCurrentLocation();
            if (!locations.length) throw new Error("No locations provided.");

            const closest = locations.reduce((prev, curr) => {
                const prevDist = this.getDistance(userCoords, prev);
                const currDist = this.getDistance(userCoords, curr);
                return currDist < prevDist ? curr : prev;
            });

            return { ...closest, distance: this.getDistance(userCoords, closest) };
        } catch (error) {
            throw new Error(`Failed to find nearest location: ${error.message}`);
        }
    }
}

export default LocationService;
