import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { X, MoreVertical, Eye, Trash2 } from 'lucide-react'; 
import toast, { Toaster } from "react-hot-toast"; // Toast notifications

import Poll from '@mui/icons-material/Poll';

import { IS_AUTH, POLL_LIST, POLL_UPLOAD, DELETE_POLL, LOGOUT } from "../../api/is_auth/api";

export default function Home() {
  const navigate = useNavigate();

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false); // Create Poll modal
  const [isPollListOpen, setIsPollListOpen] = useState(false); // Poll List modal

  // POLL INPUT STATES
  const [pollA, setPollA] = useState(""); // Poll A text
  const [pollB, setPollB] = useState(""); // Poll B text
  const [fileA, setFileA] = useState(null); // Poll A image
  const [fileB, setFileB] = useState(null); // Poll B image

  const [openPollId, setOpenPollId] = useState(null); // Tracks which poll's action menu is open
  const [polls, setPolls] = useState([]); // User polls
  const [isSubmitting, setIsSubmitting] = useState(false); // Disable submit during async operation

  // API hooks
  const { data: IsAuth, isError: IsAuthIssue, isLoading: IsAuthLoading } = IS_AUTH(); // Auth status
  const { data: PollList, isError: PollListIssue, isLoading: PollListLoading } = POLL_LIST(); // Fetch polls
  const { data: PollUploadResponse, status: PollUploadSuccess, mutate: PollUpload } = POLL_UPLOAD(IsAuth?.message?.csrf); // Create poll
  const { mutate: DeletePoll } = DELETE_POLL(IsAuth?.message?.csrf); // Delete poll
  const { status: UserLogingOut, error, isError, mutate: UserLogout } = LOGOUT(IsAuth?.message?.csrf); // Logout

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isModalOpen || isPollListOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isPollListOpen]);

  // Update polls state when API response changes
  useEffect(() => {
    if(PollList) {
      setPolls(PollList);
    }
  }, [PollList]);

  // Redirect to newly created poll
  useEffect(() => {
     if(PollUploadSuccess === 'success') {
       navigate(`/voting/${PollUploadResponse?.message}`)
     }
  }, [PollUploadSuccess, navigate]);

  // Redirect to signin after logout
  useEffect(() => {
     if(UserLogingOut === 'success') {
       navigate('/signin');
     }
  }, [UserLogingOut, navigate]);

  // Loading fallback
  if(IsAuthLoading && PollListLoading) return null;

  // HANDLE IMAGE INPUT
  const handleImageA = (e) => {
    const file = e.target.files[0];
    setFileA(file);
  }
  
  const handleImageB = (e) => {
    const file = e.target.files[0];
    setFileB(file);
  }

  // Upload image to Cloudinary
  async function UploadCommentImage(file) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "upload_file");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/ddhrugiuc/image/upload`,
        {
          method: "POST",
          body: form,
        }
      );

      if (!response.ok) {
        alert("Error uploading image");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      alert("Image upload error:", error);
      return null;
    }
  }

  // HANDLE POLL SUBMISSION
  async function handleSubmit() {
    // Prevent long poll titles
    const combinedLength = pollA.trim().length + pollB.trim().length;
    if (combinedLength > 34) {
      toast.error(`Poll A and Poll B combined should not exceed 34 characters. Current length: ${combinedLength}`);
      return; // Prevent submission
    }

    setIsSubmitting(true); // disable button

    const imageA = await UploadCommentImage(fileA);
    const imageB = await UploadCommentImage(fileB);

    // Trigger API call to upload poll
    PollUpload({
      poll_A: pollA,
      poll_B: pollB,
      image_A: imageA,
      image_B: imageB
    });

    // Reset modal and form
    setIsModalOpen(false);
    setPollA("");
    setPollB("");
    setFileA(null);
    setFileB(null);
    setIsSubmitting(false); 
  }

  // MODAL TOGGLE FUNCTIONS
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openPollListModal = () => setIsPollListOpen(true);
  const closePollListModal = () => {
    setIsPollListOpen(false);
    setOpenPollId(null);
  };

  // Form validation
  const isFormInvalid = !pollA || !fileA || !pollB || !fileB;

  // Action menu toggle
  const toggleActionMenu = (pollId) => {
    setOpenPollId(prevId => (prevId === pollId ? null : pollId));
  };

  // Placeholder view poll function
  const handleViewPoll = (pollId, pollTitle) => {
    console.log(`Viewing Poll ID: ${pollId} - ${pollTitle}`);
    alert(`Viewing poll: ${pollTitle}`);
    setOpenPollId(null);
    closePollListModal();
  };

  // Delete poll
  function handleDeletePoll(pollId) {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      // Optimistic UI update
      setPolls((prevMessages) => prevMessages.filter((poll) => poll.voting_poll_id !== pollId));

      // API call to delete poll
      DeletePoll({poll_id: pollId});
    }
  
    setOpenPollId(null);
  };
  
  // Logout function
  async function logout() {
    UserLogout(); // Call API to logout
  }
  
  return (
    <>
    {
      // Redirect if not authenticated
      IsAuth?.message?.IsAuthenticated === false && navigate('/signin')
    }

    {/* Toast notifications */}
    <Toaster position="top-center" reverseOrder={false} />

    <div className="bg-gray-50 w-full min-h-screen flex flex-col items-center p-4 pt-16 md:justify-center md:pt-4">
      {/* HEADER */}
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-[40px] font-normal" style={{ fontFamily: 'Russo One, Helvetica' }}>
          <span className="text-[#f10c68]">Battle</span>
          <span className="text-[#f3892c]">Pollster</span>
        </h1>
      </header>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-md md:max-w-4xl h-auto md:h-[500px] bg-white rounded-2xl shadow-[0px_0px_6px_#00000030] flex flex-col p-6 md:p-8">
        
        {/* USER INFO + ACTION BUTTONS */}
        <div className="flex justify-between items-center w-full">
          <div className="text-base md:text-xl" style={{ fontFamily: 'Roboto Mono, Helvetica' }}>
            <span className="text-black">Welcome:</span>
            <span className="text-gray-500">{IsAuth?.message?.username}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={openPollListModal} className="hidden md:block px-8 py-3 text-xl rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Inter, Helvetica' }}>
              My Polls
            </button>
            <button 
              onClick={logout}
              className="px-4 py-2 md:px-8 md:py-3 text-base md:text-xl rounded-xl border border-[#ed2100] text-[#ed2100] hover:bg-[#ed2100] hover:text-white transition-colors" 
              style={{ fontFamily: 'Inter, Helvetica' }}
            >
              Sign out
            </button>
          </div>
        </div>
        
        {/* CREATE POLL BUTTON */}
        <div className="flex-grow flex flex-col items-center justify-center mt-16 md:mt-0 gap-4">
          <button onClick={openPollListModal} className="block md:hidden w-full max-w-xs py-4 text-lg rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Inter, Helvetica' }}>
            My Polls
          </button>
          <button 
            onClick={openModal}
            className="w-full max-w-xs md:w-[382px] h-[60px] md:h-[67px] bg-[#007bff] hover:bg-[#0056b3] rounded-xl text-xl md:text-2xl font-bold flex items-center justify-start pl-6 pr-6 md:pl-10 md:pr-10 gap-3 md:gap-4 transition-all duration-200 active:scale-95 text-white" 
            style={{ fontFamily: 'Inter, Helvetica' }}
          >
            <Poll 
              className='-ml-1 md:ml-0 text-white'
              style={{ fontSize: 56, color: 'inherit' }}
            />
            <span className="flex-1 text-left text-white" style={{ textAlign: 'center' }}>
              Create poll
            </span>
          </button>
        </div>
      </div>

      {/* MODALS */}
      {/* Create Poll Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ fontFamily: 'Inter, Helvetica' }}>
            {/* Modal header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">Create Poll</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-5">
              {/* Poll A */}
              <div className="space-y-2">
                <input type="text" placeholder="Poll A" value={pollA} onChange={(e) => setPollA(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <input type="file" id="fileA" onChange={handleImageA} className="hidden" accept="image/*"/>
                  <label htmlFor="fileA" className="bg-gray-200 py-2 px-5 text-gray-700 cursor-pointer text-base hover:bg-gray-300 transition-colors whitespace-nowrap">Choose file</label>
                  <span className="px-4 text-gray-500 text-base truncate">{fileA ? fileA.name : 'No file chosen'}</span>
                </div>
              </div>

              {/* Poll B */}
              <div className="space-y-2">
                <input type="text" placeholder="Poll B" value={pollB} onChange={(e) => setPollB(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <input type="file" id="fileB" onChange={handleImageB} className="hidden" accept="image/*"/>
                  <label htmlFor="fileB" className="bg-gray-200 py-2 px-5 text-gray-700 cursor-pointer text-base hover:bg-gray-300 transition-colors whitespace-nowrap">Choose file</label>
                  <span className="px-4 text-gray-500 text-base truncate">{fileB ? fileB.name : 'No file chosen'}</span>
                </div>
              </div>

              {/* Submit button */}
              <button 
                onClick={handleSubmit} 
                disabled={isFormInvalid || isSubmitting} 
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-base font-semibold transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Poll List Modal */}
      {isPollListOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setOpenPollId(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" style={{ fontFamily: 'Inter, Helvetica' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-black">Poll List</h2>
              <button onClick={closePollListModal} className="text-gray-500 hover:text-black transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto">
              {polls?.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No polls found.</p>
              ) : (
                polls?.map((poll) => (
                  <div key={poll.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0 relative">
                    <Link to={`/voting/${poll.voting_poll_id}`} className="text-left flex-grow truncate text-gray-800 pr-4 hover:text-blue-600 transition-colors cursor-pointer focus:outline-none">
                        {poll.poll_a.poll_A} vs {poll.poll_b.poll_B}
                    </Link>

                    {/* Action menu button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleActionMenu(poll.id); }} 
                      className={`p-1 rounded-full transition-colors ${openPollId === poll.id ? 'text-gray-800 bg-gray-100' : 'text-gray-400 hover:text-gray-800'}`}
                      title="More Options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {/* Action menu */}
                    {openPollId === poll.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                        <button
                          onClick={() => handleViewPoll(poll.id, poll.poll_A)}
                          className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </button>
                        <button
                          onClick={() => handleDeletePoll(poll.voting_poll_id)}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </>
  );
}
