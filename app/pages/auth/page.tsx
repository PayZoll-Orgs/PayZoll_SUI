"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import Head from "next/head";
import { useForm, SubmitHandler } from "react-hook-form";
import { LoginFormData, RegisterFormData } from "@/lib/interfaces";
import { useAuth } from "@/context/authContext";
import { authApi } from "@/api/authApi";
import { backendDomain } from "@/lib/network";

import { LoginForm, RegisterForm, ResetPasswordForm, ForgotPasswordForm } from "@/components/auth/Forms"
import { BackgroundBeams } from "@/components/ui/beams";
import { Home } from "lucide-react";
import Link from "next/link";
import { MONTSERRAT } from "@/lib/fonts";
import Loader from "@/components/ui/loader";

// --- Type Definitions ---
type AuthStep = "register" | "login" | "forgotPassword" | "resetPasswordOtp";
type ForgotPasswordFormData = { email: string };
type ResetPasswordFormData = { otp: string; password: string; confirmPassword: string };


const AuthPage: React.FC = () => {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') || 'default';

    const [authStep, setAuthStep] = useState<AuthStep>("register");
    const [isLoading, setIsLoading] = useState(false);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [userEmailForOtp, setUserEmailForOtp] = useState<string | null>(null);

    const { login, register: registerUser } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);

    // Form Hooks
    const registerForm = useForm<RegisterFormData>();
    const loginForm = useForm<LoginFormData>();
    const forgotPasswordForm = useForm<ForgotPasswordFormData>();
    const resetPasswordForm = useForm<ResetPasswordFormData>();

    // Submit Handlers
    const onRegisterSubmit: SubmitHandler<RegisterFormData> = async (data) => {
        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);
        try {
            const result = await registerUser({ ...data, authMode: mode });
            if (result.success) {
                setSuccessMessage("Registration successful! Please log in.");
                registerForm.reset();
                setAuthStep("login");
            } else {
                setApiError(result.error || "Registration failed");
            }
        } catch (error: any) {
            setApiError(error.response?.data?.message || "An unexpected error occurred during registration.");
        } finally {
            setIsLoading(false);
        }
    };

    const onLoginSubmit: SubmitHandler<LoginFormData> = async (data) => {
        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);
        try {
            const result = await login({ ...data, authMode: mode });
            if (result.success) {
                console.log("Login successful");
                setSuccessMessage("Login successful! Redirecting...");
                loginForm.reset();
            } else {
                setApiError(result.error || "Login failed. Check your credentials.");
            }
        } catch (error: any) {
            setApiError(error.response?.data?.message || "An unexpected error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    };

    const onForgotPasswordSubmitHandler: SubmitHandler<ForgotPasswordFormData> = async (data) => {
        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);
        try {
            await authApi.forgotPassword(data.email);
            setUserEmailForOtp(data.email);
            setSuccessMessage(`OTP sent to ${data.email}. Check your inbox.`);
            setAuthStep("resetPasswordOtp");
            forgotPasswordForm.reset();
        } catch (error: any) {
            setApiError(error.response?.data?.message || "Failed to send OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const onResetPasswordSubmitHandler: SubmitHandler<ResetPasswordFormData> = async (data) => {
        setIsLoading(true);
        setApiError(null);
        setSuccessMessage(null);
        try {
            const payload = { ...data, email: userEmailForOtp };
            const response = await fetch(`${backendDomain}/auth/resetPassword/otp`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (response.ok) {
                setSuccessMessage("Password reset successfully. You can now log in.");
                resetPasswordForm.reset();
                setUserEmailForOtp(null);
                setAuthStep("login");
            } else {
                setApiError(result.message || "Failed to reset password. Invalid OTP or other issue.");
            }
        } catch (error) {
            setApiError("An error occurred while resetting the password.");
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to clear messages on step change
    useEffect(() => {
        setApiError(null);
        setSuccessMessage(null);
    }, [authStep]);

    // Effect to handle video loading
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const handleVideoReady = () => {
            console.log("Video can play now.");
            setIsVideoReady(true);
        };

        if (videoElement.readyState >= 3) {
            handleVideoReady();
        } else {
            videoElement.addEventListener('canplay', handleVideoReady);
        }

        return () => {
            if (videoElement) {
                videoElement.removeEventListener('canplay', handleVideoReady);
            }
        };
    }, []);

    // Render the correct form based on authStep
    const renderFormContent = () => {
        const commonProps = {
            isLoading,
            apiError,
            successMessage,
            setAuthStep,
            mode,
        };

        switch (authStep) {
            case "register":
                return <RegisterForm formMethods={registerForm} onSubmit={onRegisterSubmit} {...commonProps} />;
            case "login":
                return <LoginForm formMethods={loginForm} onSubmit={onLoginSubmit} {...commonProps} />;
            case "forgotPassword":
                return <ForgotPasswordForm formMethods={forgotPasswordForm} onSubmit={onForgotPasswordSubmitHandler} {...commonProps} />;
            case "resetPasswordOtp":
                return <ResetPasswordForm formMethods={resetPasswordForm} onSubmit={onResetPasswordSubmitHandler} userEmailForOtp={userEmailForOtp} {...commonProps} />;
            default:
                return null;
        }
    };

    if (!isVideoReady) {
        return (
            <>
                <Head>
                    <link rel="preload" href="/auth.mp4" as="video" type="video/mp4" />
                    <title>Loading...</title>
                </Head>
                <video
                    ref={videoRef}
                    src="/auth.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    style={{ display: 'none' }}
                />
                <Loader />
            </>
        );
    }

    return (
        <>
            <Head>
                <link rel="preload" href="/auth.mp4" as="video" type="video/mp4" />
                <title>Authentication</title>
            </Head>
            <BackgroundBeams />
            <div className="absolute z-50 top-4 right-4">
                <Link href="/">
                    <Home className="text-black dark:hover:text-gray-200 hover:text-gray-800 dark:text-white" size={30} />
                </Link>
            </div>
            <div className="grid xl:grid-cols-2 h-screen xl:place-content-center bg-white dark:bg-black overflow-scroll">
                <div className="dark:text-white text-black items-center justify-center hidden xl:flex">
                    <div className="relative w-full h-[100vh] overflow-hidden">
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            src="/auth.mp4"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                        />
                    </div>
                    <div className="absolute w-auto">
                        <span className={`${MONTSERRAT.className} font-bold text-white text-8xl`}>WELCOME</span>
                    </div>
                </div>
                <div className="flex relative items-center justify-center overflow-scroll p-4">
                    <div className="relative w-full max-w-xl h-[90%] rounded-lg overflow-scroll">
                        {renderFormContent()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AuthPage;
