'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getUserToken,
  setUserToken,
  removeUserToken,
  getCurrentUserProfile,
  googleAuthLogin,
  directEmailLogin,
  sendEmailVerificationOtp,
  verifyEmailVerificationOtp,
  loginUserAccount,
  registerUserAccount,
  saveUserOnboarding
} from '../lib/api';

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [remainingCredits, setRemainingCredits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const applyAuthPayload = useCallback((res) => {
    if (res.token) {
      setUserToken(res.token);
    }
    if (res.user) {
      setUser(res.user);
    }
    setActiveSubscription(res.activeSubscription || null);
    setActiveSubscriptions(res.activeSubscriptions || []);
    setRemainingCredits(Number(res.remainingCredits || 0));
    setTotalCredits(Number(res.totalCredits || 0));
    setSessionCount(Number(res.sessionCount || 0));
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getUserToken();
    if (!token) {
      setUser(null);
      setActiveSubscription(null);
      setActiveSubscriptions([]);
      setRemainingCredits(0);
      setTotalCredits(0);
      setSessionCount(0);
      setLoading(false);
      return null;
    }

    try {
      const res = await getCurrentUserProfile();
      applyAuthPayload(res);
      return res.user;
    } catch (err) {
      removeUserToken();
      setUser(null);
      setActiveSubscription(null);
      setActiveSubscriptions([]);
      setRemainingCredits(0);
      setTotalCredits(0);
      setSessionCount(0);
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyAuthPayload]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginWithGoogle = async ({ credential, accessToken }) => {
    const res = await googleAuthLogin({ credential, accessToken });
    applyAuthPayload(res);
    return res;
  };

  const directLoginWithEmail = async ({ email, name }) => {
    const res = await directEmailLogin({ email, name });
    applyAuthPayload(res);
    return res;
  };

  const requestEmailOtp = async ({ email, name }) => {
    return await sendEmailVerificationOtp({ email, name });
  };

  const verifyEmailOtpAndLogin = async ({ email, otp, name }) => {
    const res = await verifyEmailVerificationOtp({ email, otp, name });
    applyAuthPayload(res);
    return res;
  };

  const loginWithEmail = async (credentials) => {
    const res = await loginUserAccount(credentials);
    if (res.token && res.user) {
      applyAuthPayload(res);
    }
    return res;
  };

  const registerWithEmail = async (userData) => {
    const res = await registerUserAccount(userData);
    if (res.token && res.user) {
      applyAuthPayload(res);
    }
    return res;
  };

  const completeOnboarding = async (onboardingData) => {
    const res = await saveUserOnboarding(onboardingData);
    applyAuthPayload(res);
    return res;
  };

  const logout = () => {
    removeUserToken();
    setUser(null);
    setActiveSubscription(null);
    setActiveSubscriptions([]);
    setRemainingCredits(0);
    setTotalCredits(0);
    setSessionCount(0);
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        activeSubscription,
        activeSubscriptions,
        remainingCredits,
        totalCredits,
        sessionCount,
        loading,
        isAuthenticated: Boolean(user),
        isOnboarded: Boolean(user?.onboardingCompleted),
        loginWithGoogle,
        directLoginWithEmail,
        requestEmailOtp,
        verifyEmailOtpAndLogin,
        loginWithEmail,
        registerWithEmail,
        completeOnboarding,
        refreshUser,
        logout
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (!ctx) {
    throw new Error('useUserAuth must be used inside UserAuthProvider');
  }
  return ctx;
}
