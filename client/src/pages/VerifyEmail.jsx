import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from "../api/axios"

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');

        if (!token || !userId) {
          setError('Invalid verification link');
          setLoading(false);
          return;
        }

        // Call backend verification endpoint
        const response = await api.post('/users/verify-email', {
          token,
          userId,
        });

        if (response.data.success) {
          setSuccess(true);
        }
        setLoading(false);
      } catch (err) {
        console.error('Verification error:', err);
        setError(
          err.response?.data?.message || 'Failed to verify email. The link may have expired.'
        );
        setLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Loading State
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white rounded-lg p-10 max-w-md w-full shadow-lg text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Verifying your email...</h2>
          <p className="text-gray-600">Please wait while we verify your email address.</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white rounded-lg p-10 max-w-md w-full shadow-lg text-center">
          <div className="text-5xl mb-6">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Failed</h2>
          <p className="text-red-600 bg-red-50 p-4 rounded mb-8 text-sm">
            {error}
          </p>
          <div className="flex gap-3">
   
            <button 
              onClick={() => navigate('/hmis')}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (success) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white rounded-lg p-10 max-w-md w-full shadow-lg text-center">
   
          
          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Email Verified Successfully!
          </h2>
          
   
          <p className="text-gray-600 mb-8 text-sm leading-relaxed">
            Your email has been verified. A new password has been sent to your email address.
          </p>

  
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 mb-8 text-left rounded">
            <p className="text-gray-800 font-semibold mb-3 flex items-center">
              <span className="mr-2">📧</span> Check Your Email
            </p>
            <p className="text-gray-700 text-sm mb-4">
              A temporary password has been sent to your registered email address.
            </p>
            
            <p className="text-gray-800 font-semibold mb-2 flex items-center">
              <span className="mr-2">🔐</span> Next Steps
            </p>
            <ol className="text-gray-700 text-sm space-y-1 ml-6 list-decimal">
              <li>Check your email for the password</li>
              <li>Use it to login below</li>
              <li>Change your password immediately</li>
            </ol>
          </div>

       
          <button 
            onClick={() => navigate('/hmis')}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition mb-4"
          >
            Go to Login
          </button>

          <p className="text-gray-500 text-xs">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default VerifyEmail;