import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EventController from "../../../controllers/EventController";
import EventCard from "../../components/EventCard/EventCard";
import { Button, Container, Row, Col } from "react-bootstrap";
import "./events.css";
import "../../../global.css";
import MyEvents from "../../components/EventCard/MyEvents";
import { usePagination } from "../../../hooks/usePagination";
import PaginationControls from "../../components/Common/PaginationControls";
import UserController from "../../../controllers/UserController";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFilter, faCalendarAlt, faMapMarkerAlt, faTimes 
} from "@fortawesome/free-solid-svg-icons";
import { Card, Form } from "react-bootstrap";
import Select from "react-select";
import { Country, City } from "country-state-city";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [sortedEvents, setSortedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: null, end: null },
    location: null
  });
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const {
    visibleItems: visibleEvents,
    showMore: loadMoreEvents,
    showLess: showLessEvents
  } = usePagination(3, 3);

  useEffect(() => {
    // Initialize countries dropdown
    const countryOptions = Country.getAllCountries().map((country) => ({
      label: country.name,
      value: country.isoCode,
    }));
    setCountries(countryOptions);
  }, []);
  
  useEffect(() => {
    let filtered = [...events];
  
    // Filter by selected city
    if (selectedCity) {
      filtered = filtered.filter((event) => {
        const location = event.location?.toLowerCase() || "";
        return location.includes(selectedCity.label.toLowerCase());
      });
    }
  
    // Filter by date range
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);
        const afterStart = filters.dateRange.start ? eventDate >= filters.dateRange.start : true;
        const beforeEnd = filters.dateRange.end ? eventDate <= filters.dateRange.end : true;
        return afterStart && beforeEnd;
      });
    }
  
    setSortedEvents(filtered);
  }, [events, filters, selectedCity]);

  useEffect(() => {
    if (!userData || events.length === 0) {
      setSortedEvents(events);
      return;
    }

    // Parse user's location (assuming format: "City, Country")
    const [userCity = "", userCountry = ""] = (userData.address || "")
      .split(',')
      .map(part => part.trim().toLowerCase());

    let filteredEvents = [...events];

    // Apply country filter if selected
    if (selectedCountry) {
      const selectedCountryName = selectedCountry.label.toLowerCase();
      filteredEvents = filteredEvents.filter(event => {
        const [, eventCountry = ""] = (event.location || "")
          .split(',')
          .map(part => part.trim().toLowerCase());
        return eventCountry === selectedCountryName;
      });
    }

    // Apply city filter if selected
    if (selectedCity) {
      const selectedCityName = selectedCity.label.toLowerCase();
      filteredEvents = filteredEvents.filter(event => {
        const [eventCity = ""] = (event.location || "")
          .split(',')
          .map(part => part.trim().toLowerCase());
        return eventCity === selectedCityName;
      });
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.date);
        const afterStart = filters.dateRange.start 
          ? eventDate >= filters.dateRange.start 
          : true;
        const beforeEnd = filters.dateRange.end 
          ? eventDate <= filters.dateRange.end 
          : true;
        return afterStart && beforeEnd;
      });
    }

    // Sort events - same country first, then by date
    filteredEvents.sort((a, b) => {
      // Extract locations
      const [aCity = "", aCountry = ""] = (a.location || "")
        .split(',')
        .map(part => part.trim().toLowerCase());
      const [bCity = "", bCountry = ""] = (b.location || "")
        .split(',')
        .map(part => part.trim().toLowerCase());

      // Priority 1: Events in same country as user
      const aInUserCountry = aCountry && userCountry && aCountry === userCountry;
      const bInUserCountry = bCountry && userCountry && bCountry === userCountry;

      if (aInUserCountry && !bInUserCountry) return -1;
      if (!aInUserCountry && bInUserCountry) return 1;

      // Priority 2: Events in same city as user (if we have user city)
      if (userCity) {
        const aInUserCity = aCity && aCity === userCity;
        const bInUserCity = bCity && bCity === userCity;

        if (aInUserCity && !bInUserCity) return -1;
        if (!aInUserCity && bInUserCity) return 1;
      }

      // Priority 3: Sooner events first
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return aDate - bDate;
    });

    setSortedEvents(filteredEvents);
  }, [events, userData, selectedCountry, selectedCity, filters.dateRange]);
  
  
  
  
  useEffect(() => {
    if (selectedCountry) {
      const cityOptions = City.getCitiesOfCountry(selectedCountry.value).map((city) => ({
        label: city.name,
        value: city.name,
      }));
      setCities(cityOptions);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const handleDateChange = (date, field) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date
      }
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      dateRange: { start: null, end: null },
      location: null
    });
    setSelectedCountry(null);
    setSelectedCity(null);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUserData = JSON.parse(localStorage.getItem("userData"));
        if (!storedUserData || !storedUserData.email) return;

        const user = await UserController.fetchUserByEmail(storedUserData.email);
        setUserData(user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = await EventController.getEvents();
        setEvents(events);
      } catch (error) {
        setError("Failed to fetch events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0 && userData) {
      // Get user's country from address (format: "City, Country")
      const userAddressParts = userData.address?.split(',') || [];
      const userCountry = userAddressParts.length > 1 
        ? userAddressParts[1].trim().toLowerCase() 
        : "";
      
      // Sort events with priority:
      // 1. Events in same country as user
      // 2. Events happening sooner
      const sorted = [...events].sort((a, b) => {
        // Extract countries from event locations (second part after comma)
        const aLocationParts = a.location?.split(',') || [];
        const bLocationParts = b.location?.split(',') || [];
        
        const aCountry = aLocationParts.length > 1 
          ? aLocationParts[1].trim().toLowerCase() 
          : "";
        const bCountry = bLocationParts.length > 1 
          ? bLocationParts[1].trim().toLowerCase() 
          : "";
        
        // Check if events are in user's country
        const aInUserCountry = aCountry && userCountry && aCountry === userCountry;
        const bInUserCountry = bCountry && userCountry && bCountry === userCountry;
        
        // If one is in user's country and the other isn't, prioritize the one in user's country
        if (aInUserCountry && !bInUserCountry) return -1;
        if (!aInUserCountry && bInUserCountry) return 1;
        
        // If both are in same category (both in user's country or both not), sort by date
        const aDate = a.date instanceof Date ? a.date : new Date(a.date);
        const bDate = b.date instanceof Date ? b.date : new Date(b.date);
        
        return aDate - bDate; // Earlier dates come first
      });
      
      setSortedEvents(sorted);
    } else {
      setSortedEvents(events); // Fallback to unsorted if no user data
    }
  }, [events, userData]);

  const handleViewEvent = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  if (loading) {
    // return <LoadingComponent/>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <Container fluid className="mt-3">
      <Row>
        <Col md={3} className="mb-3">
          <div className="section-box">
            <h5>Events I'm Organizing</h5>
            <Button
              className="custom-btn w-100"
              onClick={() => navigate("/events/new")}
              style={{ backgroundColor: "#39aaa4", borderColor: "#39aaa4" }}
            >
              Create an Event
            </Button>
          </div>
        </Col>

        <Col md={9}>
          <div className="section-box mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Button
                variant="outline-primary"
                onClick={toggleFilters}
                className="chat-history-filter-btn"
              >
                <FontAwesomeIcon icon={faFilter} className="me-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {showFilters && (
              <Card className="filter-card mt-3">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                          Date Range
                        </Form.Label>
                        <div className="d-flex gap-2">
                          <DatePicker
                            selected={filters.dateRange.start}
                            onChange={(date) => handleDateChange(date, "start")}
                            selectsStart
                            startDate={filters.dateRange.start}
                            endDate={filters.dateRange.end}
                            placeholderText="Start Date"
                            className="form-control"
                            isClearable
                          />
                          <DatePicker
                            selected={filters.dateRange.end}
                            onChange={(date) => handleDateChange(date, "end")}
                            selectsEnd
                            startDate={filters.dateRange.start}
                            endDate={filters.dateRange.end}
                            minDate={filters.dateRange.start}
                            placeholderText="End Date"
                            className="form-control"
                            isClearable
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                          Location
                        </Form.Label>
                        <div className="mb-2">
                          <Select
                            options={countries}
                            value={selectedCountry}
                            onChange={(val) => {
                              setSelectedCountry(val);
                              setSelectedCity(null);
                            }}
                            placeholder="Select country"
                            isClearable
                            isSearchable
                          />

                          <Select
                            options={cities}
                            value={selectedCity}
                            onChange={(val) => {
                              setSelectedCity(val);
                            }}
                            placeholder="Select city"
                            isClearable
                            isSearchable
                            isDisabled={!selectedCountry}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end">
                    <Button 
                      variant="outline-danger" 
                      onClick={clearFilters}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-2" />
                      Clear Filters
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          <section className="section-box">
            {loading ? (
              <>
                <h4 className="section-title mb-0">Events Near Your Location</h4>
                {[...Array(3)].map((_, index) => (
                  <EventCard key={`skeleton-${index}`} loading />
                ))}
              </>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : sortedEvents.length > 0 ? (
              <>
                <h4 className="section-title mb-0">Events Near Your Location</h4>
                {sortedEvents.slice(0, visibleEvents).map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onViewEvent={handleViewEvent} 
                  />
                ))}
                <PaginationControls
                  onShowMore={loadMoreEvents}
                  onShowLess={showLessEvents}
                  remainingItems={sortedEvents.length - visibleEvents}
                  initialCount={visibleEvents}
                />
              </>
            ) : (
              <p>No upcoming events found.</p>
            )}
          </section>

          <section className="section-box">
            <h4 className="section-title">Events I'm Attending</h4>
            <MyEvents />
          </section>
        </Col>
      </Row>
    </Container>
  );
}