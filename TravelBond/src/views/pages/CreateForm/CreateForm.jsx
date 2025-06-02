import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Select from "react-select";
import { Country, City } from "country-state-city";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faUsers } from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";
import EventService from "../../../services/EventService";
import GroupController from "../../../controllers/GroupController";
import useSweetAlert from "../../../hooks/useSweetAlert";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/sweetalert2.css";
import "./createForm.css";

const CreateForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEventForm = location.pathname.includes("/events/new");
  const { showAlert } = useSweetAlert();
  
  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  // Event-specific state
  const [eventData, setEventData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
    duration: "",
    organizerId: "U001",
    participants: [],
    picture: null,
  });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);

  // Group-specific state
  const [groupData, setGroupData] = useState({
    title: "",
    description: "",
    main_moderator: "",
    picture: null,
  });

  // Get current user ID from localStorage when component mounts
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(userId);
      if (!isEventForm) {
        setGroupData(prev => ({ ...prev, main_moderator: userId }));
      }
    }
  }, [isEventForm]);

  useEffect(() => {
    const countryOptions = Country.getAllCountries().map((country) => ({
      label: country.name,
      value: country.isoCode,
    }));
    setCountries(countryOptions);
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (isEventForm) {
      setEventData({ ...eventData, [name]: value });
    } else {
      setGroupData({ ...groupData, [name]: value });
    }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
  
      if (file.size > maxSizeInBytes) {
        showAlert("Error", "File size must be 5MB or less.", "error", "OK");
        e.target.value = ""; // Clear the file input
        return;
      }
  
      if (isEventForm) {
        setEventData(prev => ({ ...prev, picture: file }));
      } else {
        setGroupData(prev => ({ ...prev, picture: file }));
      }
    }
  };
  

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  try {
    if (isEventForm) {
      // Event submission logic
      if (!eventData.picture) throw new Error("Please upload an event picture.");
      if (!selectedCountry || !selectedCity) throw new Error("Please select both country and city.");

      const location = `${selectedCity.label},${selectedCountry.label}`;
      const payload = { 
        ...eventData, 
        location,
        organizerId: currentUserId // Just set the organizerId here
        // Don't add to participants here - let the controller handle it
      };

      await EventService.createEvent(payload);
      showAlert("Success!", "Event created successfully!", "success", "OK");

      // Reset form
      setEventData({
        title: "",
        date: "",
        time: "",
        location: "",
        description: "",
        duration: "",
        organizerId: currentUserId,
        participants: [],
        picture: null,
      });
      setSelectedCountry(null);
      setSelectedCity(null);

      navigate("/events");
    } else {
      // Group submission logic remains the same
      if (!currentUserId) throw new Error("User not authenticated. Please log in again.");
      if (!groupData.picture) throw new Error("Please upload a group picture.");

      await GroupController.createGroup({
        ...groupData,
        main_moderator: currentUserId,
        participants: [currentUserId, ...(groupData.participants || [])]
      }, showAlert);
      
      showAlert("Success!", "Group created successfully!", "success", "OK");

      setGroupData({
        title: "",
        description: "",
        main_moderator: currentUserId,
        participants: [],
        picture: null,
      });

      navigate("/groups");
    }
  } catch (error) {
    console.error(`Error creating ${isEventForm ? "event" : "group"}:`, error);
    setError(error.message || `Failed to create ${isEventForm ? "event" : "group"}. Please try again.`);
  } finally {
    setLoading(false);
  }
};
  

  return (
    <div className="container-fluid m-3">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <section className="section-box">
            <h4 className="section-title text-center">
              <FontAwesomeIcon 
                icon={isEventForm ? faCalendar : faUsers} 
                className="me-2" 
                style={{ color: "var(--identity-color)" }} 
              />
              {isEventForm ? "Create New Event" : "Create New Group"}
            </h4>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Common Title Field */}
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  {isEventForm ? "Event Title" : "Group Title"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  name="title"
                  value={isEventForm ? eventData.title : groupData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Event-specific Fields */}
              {isEventForm && (
                <>
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      id="date"
                      name="date"
                      value={eventData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="time" className="form-label">Time</label>
                    <input
                      type="time"
                      className="form-control"
                      id="time"
                      name="time"
                      value={eventData.time}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Country</label>
                    <Select
                      options={countries}
                      value={selectedCountry}
                      onChange={setSelectedCountry}
                      placeholder="Select country"
                      isSearchable
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">City</label>
                    <Select
                      options={cities}
                      value={selectedCity}
                      onChange={setSelectedCity}
                      placeholder="Select city"
                      isSearchable
                      isDisabled={!selectedCountry}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="duration" className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-control"
                      id="duration"
                      name="duration"
                      value={eventData.duration}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              )}

              {/* Common Description Field */}
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  value={isEventForm ? eventData.description : groupData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Common Picture Upload */}
              <div className="mb-3">
                <label htmlFor="picture" className="form-label">
                  {isEventForm ? "Event Picture" : "Group Picture"}
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="picture"
                  name="picture"
                  accept="image/*"
                  onChange={handlePictureChange}
                  required
                />
              </div>

              <div className="text-center">
                <Button 
                    type="submit" 
                    disabled={loading} 
                    className={`custom-btn ${loading ? 'btn-loading' : ''}`}
                >
                    <span className="btn-text">
                    {isEventForm ? (loading ? "Creating Event..." : "Create Event") : (loading ? "Creating Group..." : "Create Group")}
                    </span>
                </Button>
                </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CreateForm;