import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Button, InputGroup } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ProgressBar from "react-bootstrap/ProgressBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/sweetalert2.css";
import zxcvbn from "zxcvbn";
import useSweetAlert from "../../../hooks/useSweetAlert";
import UserController from "../../../controllers/UserController";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { Country, City } from "country-state-city";
import "react-datepicker/dist/react-datepicker.css";
import "./auth.css";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const { showAlert } = useSweetAlert();

  const passwordStrength = zxcvbn(password);
  const strengthLabels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
  const strengthColors = ["danger", "danger", "warning", "info", "success"];

  // Load countries on component mount
  useEffect(() => {
    const countryOptions = Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
    }));
    setCountries(countryOptions);
  }, []);

  // Update cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      const cityOptions = City.getCitiesOfCountry(selectedCountry.value).map((city) => ({
        value: city.name,
        label: city.name,
      }));
      setCities(cityOptions);
      setSelectedCity(null);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate all required fields
    if (!name) {
      showAlert("Error", "Please enter your name", "error", "OK");
      setLoading(false);
      return;
    }
    
    if (!dob) {
      showAlert("Error", "Please select your date of birth", "error", "OK");
      setLoading(false);
      return;
    }
    
    if (!selectedCountry || !selectedCity) {
      showAlert("Error", "Please select your location", "error", "OK");
      setLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      showAlert("Error", "Passwords do not match.", "error", "Retry");
      setLoading(false);
      return;
    }
    
    if (passwordStrength.score < 2) {
      showAlert("Weak Password", "Please use a stronger password.", "warning", "Try Again");
      setLoading(false);
      return;
    }
    
    try {
      const existingUser = await UserController.fetchUserByEmail(email);
      
      if (existingUser) {
        showAlert("Error", "Email is already registered or banned. Please log in.", "error", "OK");
        setLoading(false);
        return;
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const address = `${selectedCity.value},${selectedCountry.label}`;
      
      const userData = await UserController.createUser(
        user.email, 
        name,
        user.photoURL,
      );
      
      if (userData) {
        await UserController.updateUser(userData.id, {
          name,
          DOB: dob,
          address,
          lastActive: new Date().toISOString()
        });
        
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("userData", JSON.stringify({
          ...userData,
          name,
          DOB: dob,
          address
        }));
        localStorage.setItem("role", userData.role);
    
        showAlert("Success!", "Account created successfully!", "success", "OK");
        window.location.href = "/dashboard";
      } else {
        throw new Error("User data could not be retrieved.");
      }
    } catch (error) {
      showAlert("Registration Failed", error.message || "Could not create an account. Please try again.", "error", "Retry");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!name || !dob || !selectedCountry || !selectedCity) {
        showAlert("Additional Info Needed", "Please complete your profile information", "info", "OK");
        return;
      }
      
      const address = `${selectedCity.value}, ${selectedCountry.label}`;
      
      const userData = await UserController.createUser(
        user.email, 
        name || user.displayName || "", 
        user.photoURL,
      );
    
      if (userData) {
        await UserController.updateUser(userData.id, {
          name: name || user.displayName || "",
          DOB: dob,
          address,
          lastActive: new Date().toISOString()
        });
        
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("userData", JSON.stringify({
          ...userData,
          name: name || user.displayName || "",
          DOB: dob,
          address
        }));
        localStorage.setItem("role", userData.role);
    
        showAlert("Success!", "Registered with Google successfully!", "success", "OK");
        window.location.href = "/dashboard";
      } else {
        throw new Error("User data could not be retrieved.");
      }
    } catch (error) {
      showAlert("Google Registration Failed", error.message || "Could not register with Google. Please try again.", "error", "Retry");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100 mb-5 mt-5">
      <Row>
        <Col md={12}>
          <Card className="p-4 shadow-lg" style={{ width: "100%", maxWidth: "800px" }}>
            <Card.Body>
              <h2 className="text-center mb-4">Register</h2>
              <Form onSubmit={handleRegister}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth *</Form.Label>
                      <DatePicker
                        selected={dob}
                        onChange={(date) => setDob(date)}
                        dateFormat="yyyy-MM-dd"
                        className="form-control"
                        placeholderText="Select your date of birth"
                        showYearDropdown
                        scrollableYearDropdown
                        yearDropdownItemNumber={100}
                        maxDate={new Date()}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Country *</Form.Label>
                      <Select
                        options={countries}
                        value={selectedCountry}
                        onChange={(selectedOption) => {
                          setSelectedCountry(selectedOption);
                          setSelectedCity(null);
                        }}
                        placeholder="Select country"
                        isSearchable
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>City *</Form.Label>
                      <Select
                        options={cities}
                        value={selectedCity}
                        onChange={setSelectedCity}
                        placeholder={selectedCountry ? "Select city" : "Select country first"}
                        isSearchable
                        isDisabled={!selectedCountry}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3 position-relative">
                      <Form.Label>Password *</Form.Label>
                      <div className="password-wrapper">
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="password-input"
                        />
                        <span
                          className="password-toggle-icon"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                        </span>
                      </div>
                      {password && (
                        <>
                          <ProgressBar
                            now={(passwordStrength.score + 1) * 20}
                            variant={strengthColors[passwordStrength.score]}
                            className="mt-2"
                          />
                          <small className="text-muted">
                            Strength: {strengthLabels[passwordStrength.score]}
                          </small>
                        </>
                      )}
                    </Form.Group>

                    <Form.Group className="mb-3 position-relative">
                      <Form.Label>Confirm Password *</Form.Label>
                      <div className="password-wrapper">
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="password-input"
                        />
                        <span
                          className="password-toggle-icon"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                        </span>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>

                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading} 
                  className={`custom-btn w-100 ${loading ? 'btn-loading' : ''}`}
                >
                  <span className="btn-text">
                    {loading ? "Registering..." : "Register"}
                  </span>
                </Button>
                
                <div className="d-flex align-items-center my-3">
                  <div className="border-bottom flex-grow-1"></div>
                  <span className="px-2 text-muted">or</span>
                  <div className="border-bottom flex-grow-1"></div>
                </div>
                
                <Button
                  variant="danger"
                  className={`custom-btn w-100 d-flex justify-content-center align-items-center ${googleLoading ? 'btn-loading' : ''}`}
                  onClick={handleGoogleRegister}
                  disabled={googleLoading}
                >
                  {!googleLoading && <FontAwesomeIcon icon={faGoogle} className="me-2" />}
                  <span className="btn-text">
                    {googleLoading ? "Registering with Google..." : "Register with Google"}
                  </span>
                </Button>
                
                <p className="mt-3 text-center">
                  Already have an account? <a href="/login">Login here</a>.
                </p>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;