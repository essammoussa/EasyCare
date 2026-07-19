import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { getDoctors } from '../../services/api';
import Navbar from '../../components/Navbar';
import 'leaflet/dist/leaflet.css';
import './MapSearch.css';

const API_BASE = 'http://localhost:5000';
const DEFAULT_CENTER = [30.0444, 31.2357]; // Cairo Downtown

// Fix for default Leaflet icon paths in builds
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Custom Circular Blue DivIcon for Doctors
const createDoctorIcon = (isActive) => {
    return new L.DivIcon({
        className: `custom-map-marker ${isActive ? 'active' : ''}`,
        html: `
      <div class="marker-container">
        <span class="material-symbols-outlined">medical_services</span>
      </div>
    `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
    });
};

// Custom Pulsing Blue DivIcon for User Location
const createUserIcon = () => {
    return new L.DivIcon({
        className: 'user-location-marker',
        html: `<div class="user-dot-outer"><div class="user-dot-inner"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

// Map Recenter Helper Component
function MapRecenter({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

// Map Resize & Invalidate Size Helper Component
function MapResizeHandler() {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();

        const onResize = () => {
            map.invalidateSize();
        };

        map.on('resize', onResize);
        map.on('zoomend', onResize);
        map.on('moveend', onResize);

        const timers = [
            setTimeout(() => map.invalidateSize(), 50),
            setTimeout(() => map.invalidateSize(), 150),
            setTimeout(() => map.invalidateSize(), 300),
            setTimeout(() => map.invalidateSize(), 600),
            setTimeout(() => map.invalidateSize(), 1000)
        ];

        window.addEventListener('resize', onResize);

        return () => {
            timers.forEach(clearTimeout);
            window.removeEventListener('resize', onResize);
            map.off('resize', onResize);
            map.off('zoomend', onResize);
            map.off('moveend', onResize);
        };
    }, [map]);
    return null;
}


// Distance Calculation Helper
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function MapSearch() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Location & Filter States
    const [centerLoc, setCenterLoc] = useState(DEFAULT_CENTER);
    const [userLoc, setUserLoc] = useState(null);
    const [search, setSearch] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [maxDistance, setMaxDistance] = useState(400); // default 400 km
    const [minRating, setMinRating] = useState('any'); // 'any', '4.0', '4.5'
    const [activeDoctorId, setActiveDoctorId] = useState(null);

    // Get User Current Position on mount with watchPosition for live tracking
    useEffect(() => {
        let watchId;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setUserLoc([lat, lng]);
                    setCenterLoc((prev) => {
                        // Only auto-center on the first fix or if user hasn't panned
                        if (!prev || (prev[0] === DEFAULT_CENTER[0] && prev[1] === DEFAULT_CENTER[1])) {
                            return [lat, lng];
                        }
                        return prev;
                    });
                },
                (err) => {
                    console.log('Geolocation error:', err.message, '- Using Cairo center.');
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 10000,      // Cache for 10 seconds max
                    timeout: 15000,         // Wait up to 15 seconds
                }
            );
        }
        return () => {
            if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, []);

    // Fetch doctors matching specialty and search name
    useEffect(() => {
        const fetchDoctors = async () => {
            setLoading(true);
            setError('');
            try {
                const params = {};
                if (specialty) params.specialty = specialty;
                if (search) params.search = search;
                const { data } = await getDoctors(params);
                setDoctors(data.doctors || data || []);
            } catch (err) {
                setError('Failed to load doctors.');
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, [specialty, search]);

    const getAvatarSrc = (doc) => {
        const pic = doc.userId?.profilePicture || doc.userId?.avatar;
        if (!pic) return `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.userId?.name || "Doctor")}&background=005596&color=fff`;
        if (pic.startsWith('http')) return pic;
        return `${API_BASE}${pic}`;
    };

    // Client-side filtering for distance, rating, availability
    const filteredDoctors = doctors.filter((doc) => {
        // 1. Rating Filter
        if (minRating !== 'any') {
            const min = parseFloat(minRating);
            if ((doc.rating || 0) < min) return false;
        }

        // 2. Location / Distance Filter
        // Doctors without coordinates are always shown (don't hide them just because no location)
        if (doc.location?.coordinates?.length === 2) {
            const docLng = doc.location.coordinates[0];
            const docLat = doc.location.coordinates[1];
            // Only filter by distance if we have valid doctor coordinates (not 0,0)
            if (docLng !== 0 || docLat !== 0) {
                const origin = userLoc || DEFAULT_CENTER;
                const dist = getDistanceKm(origin[0], origin[1], docLat, docLng);
                if (dist > maxDistance) return false;
            }
        }

        return true;
    });

    const handleResetFilters = () => {
        setSpecialty('');
        setMaxDistance(400);
        setMinRating('any');
        setSearch('');
    };

    return (
        <div className="map-page-wrapper">
            <Navbar />

            <div className="map-layout-container">

                {/* Interactive Map Canvas */}
                <div className="map-canvas-container">
                    <MapContainer
                        center={DEFAULT_CENTER}
                        zoom={13}
                        scrollWheelZoom={true}
                        zoomControl={false}
                        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <ZoomControl position="bottomright" />
                        <MapRecenter center={centerLoc} />
                        <MapResizeHandler />

                        {/* User Location Marker */}
                        {userLoc && (
                            <Marker
                                position={userLoc}
                                icon={createUserIcon()}
                            />
                        )}

                        {/* Render Doctor Markers */}
                        {filteredDoctors.map((doc) => {
                            if (!doc.location || !doc.location.coordinates || doc.location.coordinates.length !== 2) {
                                return null;
                            }
                            const docLng = doc.location.coordinates[0];
                            const docLat = doc.location.coordinates[1];
                            const docName = doc.userId?.name || 'Doctor';
                            const nextSlot = doc.availableSlots && doc.availableSlots.length > 0 ? doc.availableSlots[0] : null;

                            return (
                                <Marker
                                    key={doc._id}
                                    position={[docLat, docLng]}
                                    icon={createDoctorIcon(activeDoctorId === doc._id)}
                                    eventHandlers={{
                                        click: () => {
                                            setActiveDoctorId(doc._id);
                                        },
                                    }}
                                >
                                    <Popup>
                                        <div className="map-popup-card">
                                            <div className="popup-header">
                                                <div className="popup-avatar">
                                                    <img src={getAvatarSrc(doc)} alt={docName} />
                                                </div>
                                                <div>
                                                    <h4 className="popup-name">Dr. {docName}</h4>
                                                    <p className="popup-specialty">{doc.specialty}</p>
                                                    <div className="popup-rating">
                                                        <span className="material-symbols-outlined">star</span>
                                                        <strong>{doc.rating?.toFixed(1) || '0.0'}</strong>
                                                        <span>({doc.reviewsCount || 0} reviews)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="popup-footer">
                                                <span className="popup-availability">
                                                    {nextSlot ? (
                                                        <>
                                                            Next: <strong>{nextSlot}</strong>
                                                        </>
                                                    ) : (
                                                        'No slots available'
                                                    )}
                                                </span>
                                                <Link to={`/doctors/${doc._id}`} className="popup-book-btn">
                                                    Book
                                                </Link>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* Floating Sidebar Filters Overlay (Left Side) */}
                <aside className="floating-filters-sidebar">
                    <div className="sidebar-overlay-header">
                        <h2 className="sidebar-overlay-title font-headline-md">Filters</h2>
                        <button className="btn-reset-all" onClick={handleResetFilters}>Reset All</button>
                    </div>

                    <div className="sidebar-overlay-body scrollable-content">
                        {/* Specialty Select */}
                        <div className="filter-group">
                            <label className="filter-label">
                                <span className="material-symbols-outlined text-blue">stethoscope</span>
                                Specialty
                            </label>
                            <div className="select-dropdown-wrapper">
                                <select
                                    className="filter-select"
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                >
                                    <option value="">All Specialties</option>
                                    <option value="Cardiology">Cardiology</option>
                                    <option value="Neurology">Neurology</option>
                                    <option value="Orthopedics">Orthopedics</option>
                                    <option value="Pediatrics">Pediatrics</option>
                                    <option value="Dermatology">Dermatology</option>
                                    <option value="Gynecology">Gynecology</option>
                                    <option value="General Practice">General Practice</option>
                                </select>
                            </div>
                        </div>

                        {/* Distance Slider */}
                        <div className="filter-group">
                            <div className="slider-header-row">
                                <label className="filter-label">
                                    <span className="material-symbols-outlined text-blue">distance</span>
                                    Distance
                                </label>
                                <span className="slider-value-tag">{maxDistance} km</span>
                            </div>
                            <input
                                type="range"
                                className="distance-range-slider"
                                min="1"
                                max="500"
                                value={maxDistance}
                                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                            />
                            <div className="slider-range-labels">
                                <span>1 km</span>
                                <span>500 km</span>
                            </div>
                        </div>

                        {/* Rating Filter Chips */}
                        <div className="filter-group">
                            <label className="filter-label">
                                <span className="material-symbols-outlined text-blue">star</span>
                                Minimum Rating
                            </label>
                            <div className="rating-chips-container">
                                <button
                                    className={`rating-chip-btn ${minRating === '4.5' ? 'active' : ''}`}
                                    onClick={() => setMinRating('4.5')}
                                >
                                    4.5+
                                </button>
                                <button
                                    className={`rating-chip-btn ${minRating === '4.0' ? 'active' : ''}`}
                                    onClick={() => setMinRating('4.0')}
                                >
                                    4.0+
                                </button>
                                <button
                                    className={`rating-chip-btn ${minRating === 'any' ? 'active' : ''}`}
                                    onClick={() => setMinRating('any')}
                                >
                                    Any
                                </button>
                            </div>
                        </div>


                    </div>

                    <div className="sidebar-overlay-footer">
                        <button className="btn-show-results">
                            Show {filteredDoctors.length} Results
                        </button>
                    </div>
                </aside>

                {/* Floating Top-Right UI Elements */}
                <div className="floating-top-right-panel">
                    {/* Floating Search Input */}
                    <div className="floating-search-bar-card">
                        <span className="material-symbols-outlined search-icon-grey">search</span>
                        <input
                            type="text"
                            placeholder="Search by name or clinic..."
                            className="floating-search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* View Toggle link */}
                    <div className="floating-toggle-view-wrapper">
                        <Link to="/doctors" className="floating-btn-toggle-view">
                            <span className="material-symbols-outlined">list</span>
                            Switch to List View
                        </Link>
                    </div>

                    {/* Locate Me Button */}
                    {userLoc && (
                        <div className="floating-toggle-view-wrapper">
                            <button
                                className="floating-btn-locate-me"
                                onClick={() => setCenterLoc([...userLoc])}
                                title="Re-center to my location"
                            >
                                <span className="material-symbols-outlined">my_location</span>
                                Locate Me
                            </button>
                        </div>
                    )}
                </div>

                {/* Map Legend (Bottom Center) */}
                <div className="floating-map-legend">
                    <div className="legend-marker-item">
                        <span className="legend-marker-dot gp-blue"></span>
                        <span className="legend-marker-text">General Practitioner</span>
                    </div>
                    <div className="legend-marker-item">
                        <span className="legend-marker-dot spec-teal"></span>
                        <span className="legend-marker-text">Specialist</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
