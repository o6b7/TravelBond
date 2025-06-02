import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  sendPasswordResetEmail 
} from "firebase/auth";
import { Button, InputGroup } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../assets/sweetalert2.css";
import "./auth.css";
import UserService from "../../../services/UserService";
import useSweetAlert from "../../../hooks/useSweetAlert";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const { showAlert, showConfirmation } = useSweetAlert();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userData = await UserService.fetchUserByEmail(user.email);
    
      if (userData) {
        await UserService.updateLastActive(userData.id);
        
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("userData", JSON.stringify(userData));
        localStorage.setItem("role", userData.role);
    
        window.location.href = "/dashboard";
      } else {
        throw new Error("User data could not be retrieved.");
      }
    } catch (error) {
      showAlert("Login Failed", error.message || "Invalid email or password. Please try again.", "error", "Retry");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userData = await UserService.fetchUserByEmail(user.email);
    
      if (userData) {
        await UserService.updateLastActive(userData.id);
        
        localStorage.setItem("userId", userData.id);
        localStorage.setItem("userData", JSON.stringify(userData));
        localStorage.setItem("role", userData.role);
    
        showAlert("Success!", "Logged in with Google successfully!", "success", "OK");
        window.location.href = "/dashboard";
      } else {
        throw new Error("User data could not be retrieved.");
      }
    } catch (error) {
      showAlert("Google Login Failed", error.message || "Failed to log in with Google. Please try again.", "error", "Retry");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      showAlert("Error", "Please enter your email address first", "error", "OK");
      return;
    }
  
    try {
      // First check if the email is registered
      const userData = await UserService.fetchUserByEmail(email);
      if (!userData) {
        throw new Error("This email is not registered.");
      }
  
      const result = await showConfirmation(
        "Reset Password",
        `Are you sure you want to reset your password? We'll send a reset link to ${email}`,
        "question",
        "Yes, reset it",
        "Cancel"
      );
  
      if (result.isConfirmed) {
        await sendPasswordResetEmail(auth, email);
        showAlert(
          "Email Sent",
          `A password reset link has been sent to ${email}. Please check your inbox.`,
          "success",
          "OK"
        );
      }
    } catch (error) {
      showAlert(
        "Error",
        error.message || "Failed to send password reset email. Please try again.",
        "error",
        "OK"
      );
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Row>
        <Col md={12}>
          <Card className="p-4 shadow-lg" style={{ width: "400px" }}>
            <Card.Body>
              <h2 className="text-center">Login</h2>
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3 position-relative">
                  <Form.Label>Password</Form.Label>
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
                </Form.Group>




                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading} 
                  className={`custom-btn w-100 ${loading ? 'btn-loading' : ''}`}
                >
                  <span className="btn-text">
                    {loading ? "Logging in..." : "Login"}
                  </span>
                </Button>
              </Form>
              <div className="text-center mt-2">
                <Button 
                  variant="link" 
                  onClick={handleResetPassword}
                  className="p-0"
                >
                  Forgot password?
                </Button>
              </div>
              <hr />
              <Button
                variant="danger"
                className={`custom-btn w-100 d-flex justify-content-center align-items-center ${googleLoading ? 'btn-loading' : ''}`}
                onClick={handleGoogleLogin}
                disabled={googleLoading}
              >
                {!googleLoading && <FontAwesomeIcon icon={faGoogle} className="me-2" />}
                <span className="btn-text">
                  {googleLoading ? "Logging in with Google..." : "Login with Google"}
                </span>
              </Button>
              <p className="mt-3 text-center">
                Don't have an account? <a href="/register">Register here</a>.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;