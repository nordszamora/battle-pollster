import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import { SIGNIN } from "../../api/auth/api";

export default function Signin() {
  const navigate = useNavigate();
  
  // Input + UI states
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Error states for input validation
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // CTA button loading prevent double submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Query mutation hook
  const { status, error, isError, mutate } = SIGNIN();
  
  // Triggered when user clicks "Sign In"
  async function handleSignIn() {
    let hasError = false;

    // Basic email validation
    if (!email.trim()) {
      setEmailError("*Please enter your email.");
      hasError = true;
    } else {
      setEmailError("");
    }

    // Basic password validation
    if (!password.trim()) {
      setPasswordError("*Please enter your password.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    // Stop submission if validation failed
    if (hasError) return;

    // Begin login request
    mutate({ email: email, password: password });
  }

  // Redirect to home page once login is successful
  useEffect(() => {
    if (status === "success") {
      navigate("/");
    }
  }, [status, navigate]);

  // Show error toast from server response (401, etc.)
  useEffect(() => {
    if (isError) {
      toast.error(error.response.data.message);
      setIsSubmitting(false);
    }
  }, [isError]);

  return (
    <div className="bg-gray-50 w-full min-h-screen flex items-center justify-center p-4">
      {/* Notification container */}
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0px_0px_6px_#00000030]">
        <div className="p-8">
          
          {/* App logo / heading */}
          <h1 className="text-center mb-8 font-normal text-3xl" style={{ fontFamily: "'Russo One', Helvetica" }}>
            <span className="text-[#f10c68]">Battle</span>
            <span className="text-[#f3892c]">Pollster</span>
          </h1>

          {/* Form inputs container */}
          <div className="space-y-4 mb-6">

            {/* EMAIL INPUT */}
            <div>
              <div
                className={`flex items-center w-full rounded-lg border transition-colors ${
                  emailError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-blue-500`}
              >
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(""); // clear error on typing
                  }}
                  data-testid="input-email"
                  className="w-full py-3 px-4 bg-transparent text-base font-normal focus:outline-none"
                  style={{ fontFamily: "'Inter', Helvetica" }}
                />
              </div>

              {/* Email error message */}
              {emailError && (
                <p
                  className="text-red-500 text-sm mt-1"
                  style={{ fontFamily: "'Inter', Helvetica" }}
                  data-testid="text-email-error"
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* PASSWORD INPUT */}
            <div>
              <div
                className={`flex items-center w-full rounded-lg border transition-colors ${
                  passwordError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-blue-500`}
              >
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(""); // clear error on typing
                  }}
                  data-testid="input-password"
                  className="w-full py-3 px-4 bg-transparent text-base font-normal focus:outline-none"
                  style={{ fontFamily: "'Inter', Helvetica" }}
                />

                {/* Show/hide password toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                  className="p-2 mr-1 text-gray-500 hover:text-gray-700 rounded-full"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password validation error */}
              {passwordError && (
                <p
                  className="text-red-500 text-sm mt-1"
                  style={{ fontFamily: "'Inter', Helvetica" }}
                  data-testid="text-password-error"
                >
                  {passwordError}
                </p>
              )}
            </div>
          </div>

          {/* SIGN-IN BUTTON */}
          <button
            onClick={handleSignIn}
            data-testid="button-sign-in"
            className="w-full py-3 bg-[#007bff] hover:bg-[#0056b3] rounded-lg text-white text-lg font-semibold mb-6 transition-colors"
            style={{ fontFamily: "'Inter', Helvetica" }}
          >
            Sign in
          </button>

          {/* SIGN-UP LINK */}
          <p className="text-center font-normal text-sm" style={{ fontFamily: "'Inter', Helvetica" }}>
            <span className="text-gray-600">Don't have an account? </span>
            <Link to={"/signup"}>
              <button className="text-[#007bff] font-semibold hover:underline" data-testid="button-sign-up">
                Sign-up
              </button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
