import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronLeftIcon, HeartIcon, EyeIcon, EyeOffIcon, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { IS_AUTH } from "../../api/is_auth/api";
import { VOTING_POLL, VOTING_A, VOTING_B, POLL_EXPIRATION } from "../../api/voting/api";
import { SIGNIN } from "../../api/auth/api";

// --- SigninModal Component ---
const SigninModal = ({ isOpen, onClose, poll }) => {
  const navigate = useNavigate();
  
  // State for form inputs and errors
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // SIGNIN mutation hook from react-query or custom API hook
  const {status, error, isError, mutate: SignIn} = SIGNIN();
  
  // Validate inputs and call SignIn API
  const handleSignIn = () => {
    let hasError = false;
    if (!email.trim()) { 
      setEmailError("*Please enter your email."); 
      hasError = true; 
    } else { setEmailError(""); }

    if (!password.trim()) { 
      setPasswordError("*Please enter your password."); 
      hasError = true; 
    } else { setPasswordError(""); }

    if(hasError) return;

    SignIn({email: email, password: password});
  };
  
  // Reload page on successful login
  useEffect(() => {
     if(status === 'success') {
       window.location.reload();
     }
  }, [status, navigate]);
  
  // Show toast for errors returned by SignIn API
  useEffect(() => {
     if(isError) {
       toast.error(error.response.data.message);
       setIsSubmitting(false);
     }
  }, [isError]);

  // If modal is not open, do not render anything
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ fontFamily: 'Inter, Helvetica' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">Sign In</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Email and Password Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <div className={`flex items-center w-full rounded-lg border border-solid ${emailError ? "border-red-500" : "border-gray-300"} focus-within:ring-2 focus-within:ring-blue-500`}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }} className="w-full py-3 px-4 bg-transparent text-base focus:outline-none"/>
            </div>
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>
          <div>
            <div className={`flex items-center w-full rounded-lg border border-solid ${passwordError ? "border-red-500" : "border-gray-300"} focus-within:ring-2 focus-within:ring-blue-500`}>
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(""); }} className="w-full py-3 px-4 bg-transparent text-base focus:outline-none"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 mr-1 text-gray-500 hover:text-gray-700">
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
          </div>
        </div>

        {/* Sign In button */}
        <button onClick={handleSignIn} className="w-full py-3 bg-[#007bff] hover:bg-[#0056b3] rounded-lg text-white text-lg font-semibold mb-6 transition-colors">
          Sign in
        </button>
        <p className="text-center font-normal text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <button className="text-[#007bff] font-semibold hover:underline">Sign-up</button>
        </p>
      </div>
    </div>
  );
};

export default function Voting() {
  // Voting component state
  const [likedContestants, setLikedContestants] = useState(new Set());
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);
  const [due_date, setDueDate] = useState("");
  
  const { poll } = useParams();

  // API hooks
  const { data: IsAuth, isLoading: IsAuthLoading } = IS_AUTH();
  const { data: VotingPoll, isLoading: VotingPollLoading, refetch } = VOTING_POLL(poll);
  const { mutate: VotingA } = VOTING_A(IsAuth?.csrf);
  const { mutate: VotingB } = VOTING_B(IsAuth?.csrf);
  const { mutate: PollExpiration } = POLL_EXPIRATION(IsAuth?.csrf);

  // Handle poll expiration
  useEffect(() => {
    if(!VotingPoll) return;

    const DueDateFormat = new Intl.DateTimeFormat("en-US", {
       year: "numeric",
       month: "short",
       day: "numeric"
    });

    const dueDate = DueDateFormat.format(new Date(VotingPoll.poll_due_date));
    const today = DueDateFormat.format(new Date());

    setDueDate(dueDate);
    
    if(VotingPoll.poll_has_ended !== true && today === dueDate) {
        // Automatically mark poll as expired if due date matches today
        PollExpiration({ poll_id: poll, poll_expired: true });
    }
  }, [VotingPoll]);

  // Handle modal escape key and scroll lock
  useEffect(() => {
    document.body.style.overflow = (isImageModalOpen || isSigninModalOpen) ? 'hidden' : 'unset';
    const handleEscape = (e) => { 
      if (e.key === 'Escape') { 
        setIsImageModalOpen(false); 
        setIsSigninModalOpen(false); 
      } 
    };
    document.addEventListener('keydown', handleEscape);
    return () => { 
      document.removeEventListener('keydown', handleEscape); 
      document.body.style.overflow = 'unset'; 
    };
  }, [isImageModalOpen, isSigninModalOpen]);
  
  // Refetch poll or fallback to reload page
  const refetchOrReload = () => {
    if (typeof refetch === 'function') {
      try { refetch(); } 
      catch { window.location.reload(); }
    } else { window.location.reload(); }
  };

  // Handle voting logic for Poll A/B
  const handleHeartClick = (poll_id, voting_id, type) => {
    if (type === 'A') {
      try {
        VotingA({ poll_id, voting_id }, { onSuccess: refetchOrReload, onError: () => toast.error("Vote failed. Please try again.") });
      } catch {
        VotingA({ poll_id, voting_id });
        setTimeout(refetchOrReload, 800);
      }
    } else if (type === 'B') {
      try {
        VotingB({ poll_id, voting_id }, { onSuccess: refetchOrReload, onError: () => toast.error("Vote failed. Please try again.") });
      } catch {
        VotingB({ poll_id, voting_id });
        setTimeout(refetchOrReload, 800);
      }
    }

    // Add voted contestant to local liked state
    setLikedContestants(prev => new Set(prev).add(voting_id));
  };

  // Show image in modal
  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
    setIsImageModalOpen(true);
  };
  
  if(!VotingPoll || !VotingPoll.poll_a || !VotingPoll.poll_b) return null;

  // Calculate vote percentages for UI progress bars
  const totalVotes = VotingPoll.poll_a.vote_A + VotingPoll.poll_b.vote_B;
  const percentages = [
    totalVotes ? Math.round((VotingPoll.poll_a.vote_A / totalVotes) * 100) : 0,
    totalVotes ? Math.round((VotingPoll.poll_b.vote_B / totalVotes) * 100) : 0
  ];
  
  // Check if the user has voted for either side
  const usernameToCheck = IsAuth?.message?.username;
  const hasVotedA = VotingPoll.poll_a.voter?.some(v => v.username === usernameToCheck);
  const hasVotedB = VotingPoll.poll_b.voter?.some(v => v.username === usernameToCheck);
  const disableA = hasVotedB; // Prevent voting on both sides
  const disableB = hasVotedA;
  
  return (
    <div className="bg-white min-h-screen flex flex-col items-center px-4 pt-16 sm:p-6 lg:p-12">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="w-full max-w-4xl flex flex-col items-center mb-8">
        <header className="flex items-center justify-center text-3xl md:text-[40px] font-normal">
          <Link to={'/'} className="p-1 bg-transparent border-0 cursor-pointer mr-[-4px]">
            <ChevronLeftIcon className="w-6 md:w-10 h-6 md:h-10 text-gray-400" />
          </Link>
          <div className="flex items-center">
            <span className="text-[#f10c68]" style={{ fontFamily: 'Russo One, Helvetica' }}>Battle</span>
            <span className="text-[#f3892c]" style={{ fontFamily: 'Russo One, Helvetica' }}>Pollster</span>
          </div>
        </header>
        <div className="text-black text-sm sm:text-base md:text-lg text-center mt-2">
           {VotingPoll.poll_has_ended !== true ? (
             <span>Poll expired at {due_date}</span>
           ) : (
             <span>Poll expired.</span>
           )}
        </div>
      </div>

      {/* Voting Section */}
      <div className="w-full max-w-md md:max-w-4xl bg-white rounded-2xl shadow-[0px_0px_6px_#00000030] p-4 md:p-8 flex flex-col items-center mb-24">
        <div className="w-full flex flex-col md:flex-row md:justify-around items-center">

          {/* Poll A */}
          <div className="w-full md:w-auto flex flex-col items-center max-w-xs">
            <h2 className="font-normal text-black text-xl whitespace-nowrap mb-2">{VotingPoll.poll_a.poll_A}</h2>
            <div className="w-full h-9 rounded-[6px] bg-gray-200 overflow-hidden mb-4">
              <div className="h-full flex items-center justify-end bg-gradient-to-r from-blue-500 to-blue-400 text-white font-medium px-3 transition-all duration-500 rounded-[6px]" style={{ width: `${percentages[0]}%` }}>
                {percentages[0]}%
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full aspect-[4/3] overflow-hidden rounded-2xl mb-2 cursor-pointer" onClick={() => handleImageClick(VotingPoll.poll_a.image_A)}>
                <img src={VotingPoll.poll_a.image_A} alt={VotingPoll.poll_a.poll_A} className="w-full h-full object-cover" />
              </div>
              {/* Voting heart button */}
              {VotingPoll.poll_has_ended !== true && IsAuth?.message?.IsAuthenticated && (
                <button onClick={() => !disableA && handleHeartClick(poll, VotingPoll.poll_a.poll_id, 'A')} disabled={disableA} className={`w-[37px] h-[35px] bg-transparent border-0 cursor-pointer transition-transform ${disableA ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}`}>
                  <HeartIcon className={`w-[32px] h-[27px] transition-colors ${hasVotedA ? "fill-red-500 text-red-500" : disableA ? "text-gray-300" : "text-gray-400 hover:text-red-300"}`} />
                </button>
              )}
            </div>
          </div>

          {/* VS Text */}
          <div className="text-[#808080] text-4xl font-bold my-16 md:my-auto md:mx-8">
            VS
          </div>

          {/* Poll B (same as A with votes swapped) */}
          <div className="w-full md:w-auto flex flex-col items-center max-w-xs">
            <h2 className="font-normal text-black text-xl whitespace-nowrap mb-2">{VotingPoll.poll_b.poll_B}</h2>
            <div className="w-full h-9 rounded-[6px] bg-gray-200 overflow-hidden mb-4">
              <div className="h-full flex items-center justify-end bg-gradient-to-r from-blue-500 to-blue-400 text-white font-medium px-3 transition-all duration-500 rounded-[6px]" style={{ width: `${percentages[1]}%` }}>
                {percentages[1]}%
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-full aspect-[4/3] overflow-hidden rounded-2xl mb-2 cursor-pointer" onClick={() => handleImageClick(VotingPoll.poll_b.image_B)}>
                <img src={VotingPoll.poll_b.image_B} alt={VotingPoll.poll_b.poll_B} className="w-full h-full object-cover" />
              </div>
              {VotingPoll.poll_has_ended !== true && IsAuth?.message?.IsAuthenticated && (
                <button onClick={() => !disableB && handleHeartClick(poll, VotingPoll.poll_b.poll_id, 'B')} disabled={disableB} className={`w-[37px] h-[35px] bg-transparent border-0 cursor-pointer transition-transform ${disableB ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}`}>
                  <HeartIcon className={`w-[32px] h-[27px] transition-colors ${hasVotedB ? "fill-red-500 text-red-500" : disableB ? "text-gray-300" : "text-gray-400 hover:text-red-300"}`} />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setIsImageModalOpen(false)} />
          <div className="relative z-50 max-w-4xl w-full max-h-[90vh]">
            {selectedImage && <img src={selectedImage} alt="Full size view" className="w-full h-full object-contain rounded-lg" />}
          </div>
        </div>
      )}

      {/* Signin Modal */}
      <SigninModal isOpen={isSigninModalOpen} onClose={() => setIsSigninModalOpen(false)} poll={poll}/>

      {/* Bottom Sign-in prompt for unauthenticated users */}
      {VotingPoll.poll_has_ended !== true && IsAuth.message.IsAuthenticated !== true && (
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white shadow-[0px_0px_10px_#00000030] z-40 flex justify-center">
          <button className="w-full max-w-xs sm:max-w-md md:max-w-4xl py-3 border border-gray-400 hover:bg-gray-100 rounded-lg text-gray-700 text-lg font-semibold transition-colors" style={{ fontFamily: "'Inter', Helvetica" }} onClick={() => setIsSigninModalOpen(true)}>
            Sign in
          </button>
        </div>
      )}
    </div>
  );
}
