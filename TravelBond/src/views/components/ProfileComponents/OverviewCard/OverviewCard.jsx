import React, { useState, useEffect } from "react";
import { Card, Row, Col, Button, Form, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faGlobe,
  faGraduationCap,
  faHome,
  faCalendarAlt,
  faEnvelope,
  faEdit,
  faCheckCircle,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { Country, City } from "country-state-city";
import "react-datepicker/dist/react-datepicker.css";
import DynamicFieldList from "../DynamicFieldList/DynamicFieldList";
import useSweetAlert from "../../../../hooks/useSweetAlert";
import "./overviewCard.css";
import PhoneInput from "react-phone-input-2";
import UserController from "../../../../controllers/UserController";

const OverviewCard = ({ userData, onUpdate, readOnly }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...userData });
  const [selectedDate, setSelectedDate] = useState(
    userData.DOB ? (userData.DOB.toDate ? userData.DOB.toDate() : new Date(userData.DOB)) : null
  );
  const [educations, setEducations] = useState(userData.education || [""]);
  const [languages, setLanguages] = useState(userData.languages || [""]);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [hometownCities, setHometownCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedHometownCountry, setSelectedHometownCountry] = useState(null);
  const [selectedHometownCity, setSelectedHometownCity] = useState(null);
  const { showAlert, showConfirmation } = useSweetAlert();
  const [phoneNumber, setPhoneNumber] = useState(userData.phoneNumber?.[0] || "");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(userData.phoneNumber?.[1] || false);
  const [isChangingVerifiedNumber, setIsChangingVerifiedNumber] = useState(false);

  const handleSendVerification = async () => {
    try {
      setIsVerifying(true);
      const recaptchaContainerId = "recaptcha-container";
      
      if (!document.getElementById(recaptchaContainerId)) {
        const div = document.createElement('div');
        div.id = recaptchaContainerId;
        div.style.display = 'none';
        document.body.appendChild(div);
      }
  
      const id = await UserController.startPhoneVerification(
        phoneNumber, 
        recaptchaContainerId
      );
      
      setVerificationId(id);
      showAlert("Success", "Verification code sent to your phone", "success", "Ok");
    } catch (error) {
      console.error("Verification error:", error);
      showAlert("Error", error.message || "Failed to send verification code", "error", "Ok");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setIsVerifying(true);
      const verified = await UserController.completePhoneVerification(
        verificationId, 
        verificationCode
      );
      
      if (verified) {
        await UserController.updatePhoneNumber(userData.id, phoneNumber, true);
        setIsPhoneVerified(true);
        setEditedData(prev => ({
          ...prev,
          phoneNumber: [phoneNumber, true],
          verified: true
        }));
        showAlert("Success", "Phone number verified successfully!", "success", "Ok");
      }
    } catch (error) {
      console.error("Verification error:", error);
      showAlert("Error", error.message || "Invalid verification code", "error", "Ok");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      const container = document.getElementById('recaptcha-container');
      if (container) {
        container.remove();
      }
    };
  }, []);

  useEffect(() => {
    const countryOptions = Country.getAllCountries().map((country) => ({
      label: country.name,
      value: country.isoCode,
    }));
    setCountries(countryOptions);

    if (userData.address) {
      const addressParts = userData.address.split(',');
      if (addressParts.length >= 2) {
        const countryName = addressParts[addressParts.length - 1].trim();
        const cityName = addressParts[addressParts.length - 2].trim();
        
        const matchedCountry = countryOptions.find(c => c.label === countryName);
        if (matchedCountry) {
          setSelectedCountry(matchedCountry);
          
          const cityOptions = City.getCitiesOfCountry(matchedCountry.value).map((city) => ({
            label: city.name,
            value: city.name,
          }));
          setCities(cityOptions);
          
          const matchedCity = cityOptions.find(c => c.value === cityName);
          if (matchedCity) {
            setSelectedCity(matchedCity);
          }
        }
      }
    }

    if (userData.hometown) {
      const hometownParts = userData.hometown.split(',');
      if (hometownParts.length >= 2) {
        const countryName = hometownParts[hometownParts.length - 1].trim();
        const cityName = hometownParts[hometownParts.length - 2].trim();
        
        const matchedCountry = countryOptions.find(c => c.label === countryName);
        if (matchedCountry) {
          setSelectedHometownCountry(matchedCountry);
          
          const cityOptions = City.getCitiesOfCountry(matchedCountry.value).map((city) => ({
            label: city.name,
            value: city.name,
          }));
          setHometownCities(cityOptions);
          
          const matchedCity = cityOptions.find(c => c.value === cityName);
          if (matchedCity) {
            setSelectedHometownCity(matchedCity);
          }
        }
      }
    }
  }, [userData.address, userData.hometown]);

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
    if (selectedHometownCountry) {
      const cityOptions = City.getCitiesOfCountry(selectedHometownCountry.value).map((city) => ({
        label: city.name,
        value: city.name,
      }));
      setHometownCities(cityOptions);
    } else {
      setHometownCities([]);
      setSelectedHometownCity(null);
    }
  }, [selectedHometownCountry]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuestStatusChange = (value) => {
    setEditedData((prev) => ({ ...prev, guestStatus: value }));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setEditedData((prev) => ({ ...prev, DOB: date }));
  };

  const handleEducationChange = (index, value) => {
    const newEducations = [...educations];
    newEducations[index] = value;
    setEducations(newEducations);
  };

  const addEducationField = () => {
    setEducations([...educations, ""]);
  };

  const removeEducationField = (index) => {
    const newEducations = educations.filter((_, i) => i !== index);
    setEducations(newEducations.length > 0 ? newEducations : [""]);
  };

  const handleLanguageChange = (index, value) => {
    const newLanguages = [...languages];
    newLanguages[index] = value;
    setLanguages(newLanguages);
  };

  const addLanguageField = () => {
    setLanguages([...languages, ""]);
  };

  const removeLanguageField = (index) => {
    const newLanguages = languages.filter((_, i) => i !== index);
    setLanguages(newLanguages.length > 0 ? newLanguages : [""]);
  };

  const handleSave = async () => {
    if (phoneNumber !== userData.phoneNumber?.[0] && !isPhoneVerified) {
      showAlert("Error", "You must verify your phone number before saving", "error", "Ok");
      return;
    }
  
    try {
      const result = await showConfirmation(
        "Are you sure?",
        "Do you want to save the changes to your profile?",
        "warning",
        "Yes, save it!",
        "Cancel"
      );
  
      if (result.isConfirmed) {
        const location = selectedCity && selectedCountry 
          ? `${selectedCity.value},${selectedCountry.label}`
          : editedData.address;
  
        const hometown = selectedHometownCity && selectedHometownCountry
          ? `${selectedHometownCity.value}, ${selectedHometownCountry.label}`
          : editedData.hometown;
  
        const updatedData = {
          ...editedData,
          education: educations.filter(e => e.trim() !== ""),
          languages: languages.filter(l => l.trim() !== ""),
          address: location,
          hometown,
          phoneNumber: phoneNumber ? [phoneNumber, isPhoneVerified] : null,
          verified: isPhoneVerified,
          DOB: selectedDate,
        };
        
        await onUpdate(updatedData);
        setIsEditing(false);
        setIsChangingVerifiedNumber(false);
        showAlert("Success!", "Your profile has been updated.", "success", "OK");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      showAlert("Error", "Failed to update profile.", "error", "OK");
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return "Unknown";
    const date = dob.toDate ? dob.toDate() : new Date(dob);
    return moment().diff(moment(date), "years");
  };

  return (
    <Card className="overview-card">
      <div className="overview-header">
        <h5>Overview</h5>
        {!readOnly && (
          <Button variant="link" onClick={handleEditClick}>
            <FontAwesomeIcon icon={faEdit} />
          </Button>
        )}
      </div>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faUser} /> <strong>Name:</strong>
            </Form.Label>
            {!readOnly && isEditing ? (
              <Form.Control
                type="text"
                name="name"
                value={editedData.name || ""}
                onChange={handleChange}
              />
            ) : (
              <p>{userData.name || "Not Listed"}</p>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faUser} /> <strong>Age:</strong>
            </Form.Label>
            {!readOnly && isEditing ? (
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                className="form-control"
                placeholderText="Select Date of Birth"
                showYearDropdown 
                showMonthDropdown 
                dropdownMode="select" 
                yearDropdownItemNumber={100} 
                scrollableYearDropdown  
              />

            ) : (
              <p>{calculateAge(userData.DOB)}</p>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faGlobe} /> <strong>Languages:</strong>
            </Form.Label>
            {!readOnly && isEditing ? (
              <DynamicFieldList
                fields={languages}
                onAddField={addLanguageField}
                onRemoveField={removeLanguageField}
                onChangeField={handleLanguageChange}
                placeholder="Language"
              />
            ) : (
              <ul className="education-list">
                {userData.languages?.map((lang, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                    {lang}
                  </li>
                ))}
              </ul>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faGraduationCap} /> <strong>Education:</strong>
            </Form.Label>
            {!readOnly && isEditing ? (
              <DynamicFieldList
                fields={educations}
                onAddField={addEducationField}
                onRemoveField={removeEducationField}
                onChangeField={handleEducationChange}
                placeholder="Certificate"
              />
            ) : (
              <ul className="education-list">
                {userData.education?.map((edu, index) => (
                  <li key={index}>
                    <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                    {edu}
                  </li>
                ))}
              </ul>
            )}
          </Form.Group>

          {/* Phone Number Section - Only shown when not readOnly (Profile.jsx) */}
          {!readOnly && (
            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faPhone} /> <strong>Phone Number <small>(works for testing numbers only)</small>:</strong>
              </Form.Label>
              {isEditing ? (
                <>
                  <PhoneInput
                    country={'us'}
                    value={phoneNumber}
                    onChange={(value) => {
                      setPhoneNumber(value);
                      if (userData.phoneNumber?.[0] && value !== userData.phoneNumber[0]) {
                        setIsPhoneVerified(false);
                        setVerificationId(null);
                        setVerificationCode("");
                      }
                    }}
                    disabled={isPhoneVerified && !isChangingVerifiedNumber}
                    inputClass="form-control"
                    containerClass="phone-input-container"
                  />
                  
                  {isPhoneVerified && (
                    <div className="d-flex align-items-center mt-2">
                      <span className="text-success me-2">
                        <FontAwesomeIcon icon={faCheckCircle} /> Verified
                      </span>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => {
                          setIsChangingVerifiedNumber(true);
                          setIsPhoneVerified(false);
                        }}
                      >
                        Change Number
                      </Button>
                    </div>
                  )}
                  
                  {(!isPhoneVerified || isChangingVerifiedNumber) && phoneNumber && (
                    <div className="mt-2">
                      <div id="recaptcha-container"></div>
                      
                      {!verificationId ? (
                        <Button 
                          variant="primary" 
                          onClick={handleSendVerification}
                          disabled={isVerifying}
                        >
                          {isVerifying ? "Sending..." : "Send Verification Code"}
                        </Button>
                      ) : (
                        <>
                          <Form.Control
                            type="text"
                            placeholder="Enter verification code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="mt-2"
                          />
                          <Button 
                            variant="success" 
                            onClick={handleVerifyCode}
                            disabled={isVerifying || !verificationCode}
                            className="mt-2"
                          >
                            {isVerifying ? "Verifying..." : "Verify Code"}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p>
                  {userData.phoneNumber?.[0] || "Not provided"}
                  {userData.phoneNumber?.[1] && (
                    <span className="text-success ms-2">
                      <FontAwesomeIcon icon={faCheckCircle} /> Verified
                    </span>
                  )}
                </p>
              )}
            </Form.Group>
          )}

        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faHome} /> <strong>Hometown:</strong>
            </Form.Label>
            {!readOnly && isEditing ? (
              <>
                <div className="mb-2">
                  <label className="form-label">Country</label>
                  <Select
                    options={countries}
                    value={selectedHometownCountry}
                    onChange={setSelectedHometownCountry}
                    placeholder="Select country"
                    isSearchable
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">City</label>
                  <Select
                    options={hometownCities}
                    value={selectedHometownCity}
                    onChange={setSelectedHometownCity}
                    placeholder="Select city"
                    isSearchable
                    isDisabled={!selectedHometownCountry}
                  />
                </div>
              </>
            ) : (
              <p>{userData.hometown || "Not Listed"}</p>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faCalendarAlt} /> <strong>Guest Status:</strong>
            </Form.Label>
            {!readOnly && isEditing ? (
              <select
                value={editedData.guestStatus || "Maybe Accepting Guests"}
                onChange={(e) => handleGuestStatusChange(e.target.value)}
                className="form-select mb-3"
              >
                <option value="Accepting Guests">Accepting Guests</option>
                <option value="Maybe Accepting Guests">Maybe Accepting Guests</option>
                <option value="Not Accepting Guests">Not Accepting Guests</option>
              </select>
            ) : (
              <p>{editedData.guestStatus || "Maybe Accepting Guests"}</p>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faHome} /> <strong>Accommodation Type:</strong>
            </Form.Label>
            {!readOnly && isEditing ? (
              <Form.Control
                type="text"
                name="accommodationType"
                value={editedData.accommodationType || ""}
                onChange={handleChange}
              />
            ) : (
              <p>{userData.accommodationType || "Not Listed"}</p>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <FontAwesomeIcon icon={faEnvelope} /> <strong>Location:</strong>
            </Form.Label>
            {!readOnly && isEditing ? (
              <>
                <div className="mb-2">
                  <label className="form-label">Country</label>
                  <Select
                    options={countries}
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                    placeholder="Select country"
                    isSearchable
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">City</label>
                  <Select
                    options={cities}
                    value={selectedCity}
                    onChange={setSelectedCity}
                    placeholder="Select city"
                    isSearchable
                    isDisabled={!selectedCountry}
                  />
                </div>
              </>
            ) : (
              <p>{userData.address || "Not Listed"}</p>
            )}
          </Form.Group>
        </Col>
      </Row>
      {!readOnly && isEditing && (
        <div className="overview-actions mt-3">
          <Button variant="primary" onClick={handleSave} className="me-2">
            Save Changes
          </Button>
          <Button variant="secondary" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
};

export default OverviewCard;