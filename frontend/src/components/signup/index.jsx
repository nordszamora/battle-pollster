import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

import { SIGNUP } from "../../api/auth/api";

export default function Signup() {
  const navigate = useNavigate();
  
  // Track form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User input fields
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Track validation errors
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Custom hook for signup API request (React Query)
  const { status, error, isError, mutate } = SIGNUP();

  // Update input fields & clear existing errors
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear specific input error once user edits it
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      // Temporary errors object for validation
      const newErrors = {
        email: "",
        password: "",
        confirmPassword: "",
      };

      // --- EMAIL VALIDATION ---
      if (!formData.email.trim()) {
        newErrors.email = "*Please add your email.";
      }

      // --- PASSWORD VALIDATION ---
      if (!formData.password.trim()) {
        newErrors.password = "*Please add your password.";
      } else if (formData.password.length < 8) {
        newErrors.password = "*Password must be 8 digits.";
      }

      // --- CONFIRM PASSWORD VALIDATION ---
      if (!formData.confirmPassword.trim()) {
        newErrors.confirmPassword = "*Please confirm your password.";
      } else if (formData.confirmPassword.length < 8) {
        newErrors.confirmPassword = "*Password must be 8 digits.";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "*Passwords do not match.";
      }

      // Apply validation errors
      setErrors(newErrors);

      // Submit only when NO errors exist
      if (
        !newErrors.email &&
        !newErrors.password &&
        !newErrors.confirmPassword
      ) {
        setIsSubmitting(true);

        // Trigger signup API
        mutate({ email: formData.email, password: formData.password });
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  }

  // If signup is successful → redirect to homepage
  useEffect(() => {
    if (status === "success") {
      navigate("/");
    }
  }, [status, navigate]);

  // API error handler (ex: email already exists)
  useEffect(() => {
    if (isError) {
      toast.error(error.response.data.email);
      setIsSubmitting(false);
    }
  }, [isError]);

  return (
    <div className="bg-gray-50 w-full min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0px_0px_6px_#00000030]">
        <div className="p-8">
          {/* App Title */}
          <h1 className="text-center mb-8 font-normal text-3xl" style={{ fontFamily: "'Russo One', Helvetica" }}>
            <span className="text-[#f10c68]">Battle</span>
            <span className="text-[#f3892c]">Pollster</span>
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 mb-6">
              
              {/* EMAIL FIELD */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full py-3 px-4 bg-white rounded-lg border text-base font-normal ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  style={{ fontFamily: "'Inter', Helvetica" }}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD FIELD */}
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`w-full py-3 px-4 bg-white rounded-lg border text-base font-normal ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  style={{ fontFamily: "'Inter', Helvetica" }}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD FIELD */}
              <div>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  className={`w-full py-3 px-4 bg-white rounded-lg border text-base font-normal ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  style={{ fontFamily: "'Inter', Helvetica" }}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="w-full py-3 bg-[#007bff] hover:bg-[#0056b3] rounded-lg text-white text-lg font-semibold mb-6 transition-colors"
              style={{ fontFamily: "'Inter', Helvetica" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing up..." : "Signup"}
            </button>
          </form>

          {/* Already have an account? */}
          <p className="text-center font-normal text-sm" style={{ fontFamily: "'Inter', Helvetica" }}>
            <span className="text-gray-600">Already have an account? </span>
            <Link to={"/signin"}>
              <button className="text-[#007bff] font-semibold hover:underline">
                Sign-in
              </button>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
