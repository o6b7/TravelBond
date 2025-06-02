import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Container, Button, Row, Col, Form, 
  Card, Badge, InputGroup 
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, faFilter, faCalendarAlt,
  faMapMarkerAlt, faTimes, faSearch
} from "@fortawesome/free-solid-svg-icons";
import EventCard from "../../components/EventCard/EventCard";
import GroupCard from "../../components/GroupCard/GroupCard";
import UserCard from "../../components/UserCard/UserCard";
import EventController from "../../../controllers/EventController";
import GroupController from "../../../controllers/GroupController";
import UserController from "../../../controllers/UserController";
import { usePagination } from "../../../hooks/usePagination";
import PaginationControls from "../../components/Common/PaginationControls";
import Select from "react-select";
import { Country, City } from "country-state-city";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./FilteredData.css";
import LoadingComponent from "../../components/Common/LoadingComponent/LoadingComponent";

const FilteredData = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { query } = location.state || {};
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [allResults, setAllResults] = useState({
    events: [],
    groups: [],
    users: []
  });
  const [filteredResults, setFilteredResults] = useState({
    events: [],
    groups: [],
    users: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: null, end: null },
    location: null,
    searchType: "all",
    searchedItem: location.state?.query || "" 
  });
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // Pagination hooks
  const {
    visibleItems: visibleEvents,
    showMore: loadMoreEvents,
    showLess: showLessEvents,
    resetPagination: resetEventsPagination
  } = usePagination(6, 6);

  const {
    visibleItems: visibleGroups,
    showMore: loadMoreGroups,
    showLess: showLessGroups,
    resetPagination: resetGroupsPagination
  } = usePagination(6, 6);

  const {
    visibleItems: visibleUsers,
    showMore: loadMoreUsers,
    showLess: showLessUsers,
    resetPagination: resetUsersPagination
  } = usePagination(6, 6);

  useEffect(() => {
    const countryOptions = Country.getAllCountries().map((country) => ({
      label: country.name,
      value: country.isoCode,
    }));
    setCountries(countryOptions);
  }, []);

  useEffect(() => {
    if (location.state?.query) {
      setFilters(prev => ({
        ...prev,
        searchedItem: location.state.query
      }));
    }
  }, [location.state?.query]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        resetEventsPagination();
        resetGroupsPagination();
        resetUsersPagination();
        
        if (location.state?.showAllUsers) {
          const users = await UserController.fetchUsers();
          setAllResults({
            events: [],
            groups: [],
            users: users
          });
          setFilteredResults({
            events: [],
            groups: [],
            users: users
          });
          setActiveTab("users");
          setFilters(prev => ({ ...prev, searchType: "users" }));
        } else {
          const events = await EventController.getEvents();
          const groups = await GroupController.fetchGroups();
          const users = await UserController.fetchUsers();
  
          setAllResults({
            events,
            groups,
            users
          });
  
          applyFilters(events, groups, users);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [filters.searchedItem, location.state?.showAllUsers]);

  useEffect(() => {
    if (allResults.events.length > 0 || allResults.groups.length > 0 || allResults.users.length > 0) {
      applyFilters(allResults.events, allResults.groups, allResults.users);
    }
  }, [filters, selectedCountry, selectedCity]);

  const applyFilters = (events, groups, users) => {
    const filteredEvents = filterEvents(events);
    const filteredGroups = filterGroups(groups);
    const filteredUsers = filterUsers(users);

    setFilteredResults({
      events: filteredEvents,
      groups: filteredGroups,
      users: filteredUsers
    });
  };

  // In the filter functions, add sorting logic:

  const filterEvents = (events) => {
    let filtered = events;
    
    if (filters.searchedItem && filters.searchedItem.trim() !== "") {
      filtered = filtered.filter(event => {
        return matchesSearchQuery(event.title, filters.searchedItem) ||
              matchesSearchQuery(event.description, filters.searchedItem) ||
              matchesSearchQuery(event.location, filters.searchedItem);
      });
    }

    filtered = filtered.filter(event => {
      const matchesDate = isWithinDateRange(
        event.date, 
        filters.dateRange.start, 
        filters.dateRange.end
      );
      const matchesLoc = matchesLocation(event.location);
      return matchesDate && matchesLoc;
    });

    // Sort events by: 1) same country first, 2) more participants first
    return filtered.sort((a, b) => {
      // Check if events are in the same country as selected
      const aInSelectedCountry = selectedCountry ? 
        a.location?.toLowerCase().includes(selectedCountry.label.toLowerCase()) : false;
      const bInSelectedCountry = selectedCountry ? 
        b.location?.toLowerCase().includes(selectedCountry.label.toLowerCase()) : false;
      
      // Same country comes first
      if (aInSelectedCountry && !bInSelectedCountry) return -1;
      if (!aInSelectedCountry && bInSelectedCountry) return 1;
      
      // Then sort by number of participants (descending)
      return (b.participants?.length || 0) - (a.participants?.length || 0);
    });
  };

  const filterGroups = (groups) => {
    let filtered = groups;
    
    if (filters.searchedItem && filters.searchedItem.trim() !== "") {
      filtered = filtered.filter(group => {
        return matchesSearchQuery(group.title, filters.searchedItem) ||
              matchesSearchQuery(group.description, filters.searchedItem);
      });
    }

    // Sort groups by number of participants (descending)
    return filtered.sort((a, b) => 
      (b.members?.length || 0) - (a.members?.length || 0)
    );
  };

  const filterUsers = (users) => {
    let filtered = users;
    
    if (location.state?.showAllUsers) {
      filtered = filtered.filter(user => matchesLocation(user.address));
    } else if (filters.searchedItem && filters.searchedItem.trim() !== "") {
      filtered = filtered.filter(user => {
        const matchesQuery = 
          matchesSearchQuery(user.name, filters.searchedItem) ||
          matchesSearchQuery(user.email, filters.searchedItem) ||
          matchesSearchQuery(user.bio, filters.searchedItem) ||
          matchesSearchQuery(user.address, filters.searchedItem);
        const matchesLoc = matchesLocation(user.address);
        return matchesQuery && matchesLoc;
      });
    } else {
      filtered = filtered.filter(user => matchesLocation(user.address));
    }

    // Sort users by: 1) has address first, 2) more friends first
    return filtered.sort((a, b) => {
      // Users with address come first
      if (a.address && !b.address) return -1;
      if (!a.address && b.address) return 1;
      
      // Then sort by number of friends (descending)
      return (b.friends?.length || 0) - (a.friends?.length || 0);
    });
  };

  const matchesSearchQuery = (text, searchQuery) => {
    if (!text || !searchQuery || searchQuery.trim() === "") return false;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const isWithinDateRange = (timestamp, startDate, endDate) => {
    if (!startDate && !endDate) return true;
    const eventDate = new Date(timestamp);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (start && eventDate < start) return false;
    if (end && eventDate > end) return false;
    return true;
  };

  const matchesLocation = (locationString) => {
    if (!selectedCountry && !selectedCity) return true;
    if (!locationString) return false;
    
    try {
      const parts = locationString.split(',').map(part => part.trim().toLowerCase());
      
      // First check if country matches (if selected)
      if (selectedCountry) {
        const countryMatch = parts.some(part => 
          part === selectedCountry.label.toLowerCase()
        );
        
        // If city is also selected, check both
        if (selectedCity) {
          return countryMatch && parts.some(part => 
            part === selectedCity.value.toLowerCase()
          );
        }
        
        return countryMatch;
      }
      
      return false;
    } catch (error) {
      console.error("Error parsing location:", error);
      return false;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewEvent = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleViewGroup = (groupId) => {
    navigate(`/groups/${groupId}`);
  };

  const handleViewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

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

  const handleSearchTypeChange = (type) => {
    setFilters(prev => ({
      ...prev,
      searchType: type
    }));
    setActiveTab(type);
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: null, end: null },
      location: null,
      searchType: "all",
      searchedItem: ""
    });
    setSelectedCountry(null);
    setSelectedCity(null);
    setActiveTab("all");
  };

  const handleSearchItemChange = (e) => {
    setFilters(prev => ({
      ...prev,
      searchedItem: e.target.value
    }));
  };

  return (
    <Container className="filtered-data-container">
      <div className="search-box">
        <div className="search-header">
          <Button 
            variant="link" 
            onClick={handleBack} 
            className="back-button"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
            Back
          </Button>
          
          <h2 className="search-title">
            {filters.searchedItem ? `Search Results for "${filters.searchedItem}"` : "Search"}
          </h2>

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
          <Card className="filter-card mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Searched Item
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="What are you looking for?"
                      value={filters.searchedItem}
                      onChange={handleSearchItemChange}
                    />
                  </Form.Group>

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

                <Col md={4}>
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
                    </div>
                    <div className="mb-2">
                      <Select
                        options={cities}
                        value={selectedCity}
                        onChange={setSelectedCity}
                        placeholder="Select city"
                        isClearable
                        isSearchable
                        isDisabled={!selectedCountry}
                      />
                    </div>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Search Type</Form.Label>
                    <div className="d-flex flex-column gap-2">
                      <Button
                        variant={filters.searchType === "all" ? "primary" : "outline-secondary"}
                        onClick={() => handleSearchTypeChange("all")}
                        className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                      >
                        All
                      </Button>
                      <Button
                        variant={filters.searchType === "events" ? "primary" : "outline-secondary"}
                        onClick={() => handleSearchTypeChange("events")}
                        className={`filter-btn ${activeTab === 'events' ? 'active' : ''}`}
                      >
                        Events
                      </Button>
                      <Button
                        variant={filters.searchType === "groups" ? "primary" : "outline-secondary"}
                        onClick={() => handleSearchTypeChange("groups")}
                        className={`filter-btn ${activeTab === 'groups' ? 'active' : ''}`}
                      >
                        Groups
                      </Button>
                      <Button
                        variant={filters.searchType === "users" ? "primary" : "outline-secondary"}
                        onClick={() => handleSearchTypeChange("users")}
                        className={`filter-btn ${activeTab === 'users' ? 'active' : ''}`}
                      >
                        Users
                      </Button>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end mt-2">
                <Button 
                  variant="outline-danger" 
                  onClick={clearFilters}
                  className="me-2"
                >
                  <FontAwesomeIcon icon={faTimes} className="me-2" />
                  Clear Filters
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}

        <div className="filter-buttons mb-3">
          <Button
            className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </Button>
          <Button
            className={`filter-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events
          </Button>
          <Button
            className={`filter-btn ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            Groups
          </Button>
          <Button
            className={`filter-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </Button>
        </div>
      </div>

      {(loading)? <LoadingComponent/> :
            <div className="results-box">
            {loading ? (<LoadingComponent/>) : (
              <>
                {activeTab === "events" && filteredResults.events.length === 0 && (
                  <div className="no-results-message">
                    No events found matching your search
                  </div>
                )}
    
                {activeTab === "groups" && filteredResults.groups.length === 0 && (
                  <div className="no-results-message">
                    No groups found matching your search
                  </div>
                )}
    
                {activeTab === "users" && filteredResults.users.length === 0 && (
                  <div className="no-results-message">
                    {filters.searchedItem ? "No users found matching your search" : "Enter a search term to find users"}
                  </div>
                )}
    
                {activeTab === "all" && 
                  filteredResults.events.length === 0 && 
                  filteredResults.groups.length === 0 && 
                  filteredResults.users.length === 0 && (
                  <div className="no-results-message">
                    {filters.searchedItem ? "No results found matching your search" : "Enter a search term to find results"}
                  </div>
                )}
    
                {(activeTab === "all" || activeTab === "events") && filteredResults.events.length > 0 && (
                  <section className="dashboard-section mb-4">
                    <div className="section-header d-flex justify-content-between align-items-center mb-3">
                      <h3 className="section-title">
                        Events ({filteredResults.events.length})
                      </h3>
                    </div>
                    <div className="card-container">
                      {loading ? (
                        <>
                          {[...Array(3)].map((_, index) => (
                            <div key={`event-skeleton-${index}`} className="event-card skeleton">
                              <div className="event-header">
                                <div className="skeleton-title"></div>
                              </div>
                              <div className="event-details">
                                <div className="skeleton-detail">
                                  <span className="skeleton-icon"></span>
                                  <span className="skeleton-text"></span>
                                </div>
                                <div className="skeleton-detail">
                                  <span className="skeleton-icon"></span>
                                  <span className="skeleton-text"></span>
                                </div>
                                <div className="skeleton-detail">
                                  <span className="skeleton-icon"></span>
                                  <span className="skeleton-text"></span>
                                </div>
                                <div className="skeleton-detail">
                                  <span className="skeleton-icon"></span>
                                  <span className="skeleton-text"></span>
                                </div>
                              </div>
                              <div className="skeleton-button"></div>
                            </div>
                          ))}
                        </>
                      ) : (
                        filteredResults.events.slice(0, visibleEvents).map(event => (
                          <EventCard 
                            key={event.id}
                            event={event} 
                            onViewEvent={handleViewEvent}
                          />
                        ))
                      )}
                    </div>
                    <PaginationControls
                      onShowMore={loadMoreEvents}
                      onShowLess={showLessEvents}
                      remainingItems={filteredResults.events.length - visibleEvents}
                      initialCount={visibleEvents}
                    />
                  </section>
                )}
    
                {(activeTab === "all" || activeTab === "groups") && filteredResults.groups.length > 0 && (
                  <section className="dashboard-section mb-4">
                    <div className="section-header d-flex justify-content-between align-items-center mb-3">
                      <h3 className="section-title">
                        Groups ({filteredResults.groups.length})
                      </h3>
                    </div>
                    <div className="card-container">
                      {loading ? (
                        <>
                          {[...Array(3)].map((_, index) => (
                            <div key={`group-skeleton-${index}`} className="group-card skeleton">
                              <div className="group-header">
                                <div className="skeleton-title"></div>
                                <div className="skeleton-description"></div>
                              </div>
                              <div className="group-stats">
                                <div className="skeleton-stat">
                                  <span className="skeleton-icon"></span>
                                  <span className="skeleton-text"></span>
                                </div>
                                <div className="skeleton-stat">
                                  <span className="skeleton-icon"></span>
                                  <span className="skeleton-text"></span>
                                </div>
                              </div>
                              <div className="skeleton-activity"></div>
                              <div className="skeleton-button"></div>
                            </div>
                          ))}
                        </>
                      ) : (
                        filteredResults.groups.slice(0, visibleGroups).map(group => (
                          <GroupCard 
                            key={group.id}
                            group={group} 
                            onViewGroup={handleViewGroup}
                          />
                        ))
                      )}
                    </div>
                    <PaginationControls
                      onShowMore={loadMoreGroups}
                      onShowLess={showLessGroups}
                      remainingItems={filteredResults.groups.length - visibleGroups}
                      initialCount={visibleGroups}
                    />
                  </section>
                )}
                
                {(activeTab === "all" || activeTab === "users") && filteredResults.users.length > 0 && (
                  <section className="dashboard-section mb-4">
                    <div className="section-header d-flex justify-content-between align-items-center mb-3">
                      <h3 className="section-title">
                        Users ({filteredResults.users.length})
                      </h3>
                    </div>
                    <div className="card-container">
                      {loading ? (
                        <div className="row row-cols-1 g-3">
                          {[...Array(3)].map((_, index) => (
                            <div className="col px-0" key={`skeleton-${index}`}>
                              <UserCard loading />
                            </div>
                          ))}
                        </div>
                      ) : (
                        filteredResults.users.slice(0, visibleUsers).map(user => (
                          <UserCard 
                            key={user.id}
                            user={user} 
                            onViewUser={handleViewProfile}
                          />
                        ))
                      )}
                    </div>
                    <PaginationControls
                      onShowMore={loadMoreUsers}
                      onShowLess={showLessUsers}
                      remainingItems={filteredResults.users.length - visibleUsers}
                      initialCount={visibleUsers}
                    />
                  </section>
                )}
              </>
            )}
          </div>
      }

    </Container>
  );
};

export default FilteredData;