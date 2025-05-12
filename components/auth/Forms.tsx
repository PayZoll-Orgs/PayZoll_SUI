import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React from "react";
import { SubmitHandler, UseFormReturn } from "react-hook-form";
import { LoginFormData, RegisterFormData } from "@/lib/interfaces";

type AuthStep = "register" | "login" | "forgotPassword" | "resetPasswordOtp";
type ForgotPasswordFormData = { email: string };
type ResetPasswordFormData = { otp: string; password: string; confirmPassword: string };


const BottomGradient = () => {
    return (
        <>
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
        </>
    );
};

const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("flex w-full flex-col space-y-2", className)}>
            {children}
        </div>
    );
};
// --- Form Component Props Interfaces ---
interface FormProps<T extends Record<string, any>> {
    formMethods: UseFormReturn<T>;
    onSubmit: SubmitHandler<T>;
    isLoading: boolean;
    apiError: string | null;
    successMessage: string | null;
    setAuthStep: (step: AuthStep) => void;
}

interface RegisterFormProps extends FormProps<RegisterFormData> {
    mode?: string;
}
interface LoginFormProps extends FormProps<LoginFormData> {
    mode?: string;
}
interface ForgotPasswordFormProps extends FormProps<ForgotPasswordFormData> { }
interface ResetPasswordFormProps extends FormProps<ResetPasswordFormData> {
    userEmailForOtp: string | null;
}


const LoginForm: React.FC<LoginFormProps> = ({
    formMethods,
    onSubmit,
    isLoading,
    apiError,
    successMessage,
    setAuthStep,
    mode = 'default'
}) => {
    const { register, handleSubmit, formState: { errors } } = formMethods;

    // Dynamic headings based on mode
    let heading = "Welcome back to PayZoll";
    let subheading = "Login to manage your crypto payroll.";

    if (mode === 'p2p') {
        heading = "Welcome to P2P.new";
        subheading = "Login to access your secure payment system.";
    } else if (mode === 'payroll') {
        heading = "Welcome to PayZoll Payroll";
        subheading = "Login to manage your crypto payroll.";
    }

    return (
        <>
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-200">
                {heading}
            </h2>
            <p className="mt-2 max-w-sm text-sm sm:text-lg text-neutral-600 dark:text-neutral-300">
                {subheading}
            </p>
            <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
                {apiError && <p className="mb-4 text-sm sm:text-lg text-red-600 dark:text-red-400">{apiError}</p>}
                {successMessage && <p className="mb-4 text-sm sm:text-lg text-green-600 dark:text-green-400">{successMessage}</p>}

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="email" className="text-sm sm:text-lg">Email Address</Label>
                    <Input id="email" placeholder="you@company.com" type="email" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("email", { required: "Email is required" })} />
                    {errors.email && <p className="text-sm sm:text-lg text-red-500">{errors.email.message}</p>}
                </LabelInputContainer>
                <LabelInputContainer className="mb-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm sm:text-lg">Password</Label>
                        <button
                            type="button"
                            onClick={() => setAuthStep("forgotPassword")}
                            className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <Input id="password" placeholder="••••••••" type="password" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("password", { required: "Password is required" })} />
                    {errors.password && <p className="text-sm sm:text-lg text-red-500">{errors.password.message}</p>}
                </LabelInputContainer>

                <button
                    className="group/btn relative block h-10 sm:h-12 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    type="submit"
                    disabled={isLoading}
                >
                    <span className="text-sm sm:text-lg">
                        {isLoading ? "Logging In..." : "Login"} &rarr;
                    </span>
                    <BottomGradient />
                </button>

                <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                <p className="mt-4 text-center text-sm sm:text-lg text-neutral-600 dark:text-neutral-300">
                    Don't have an account?{" "}
                    <button type="button" onClick={() => setAuthStep("register")} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Register
                    </button>
                </p>
            </form>
        </>
    );
};


// --- Register Form Component ---
const RegisterForm: React.FC<RegisterFormProps> = ({
    formMethods,
    onSubmit,
    isLoading,
    apiError,
    successMessage,
    setAuthStep,
    mode = 'default'  // Default mode if not specified
}) => {
    const { register, handleSubmit, formState: { errors }, watch } = formMethods;

    // Dynamic headings based on mode
    let heading = "Create your PayZoll Account";
    let subheading = "Join us to simplify your crypto payroll.";

    if (mode === 'p2p') {
        heading = "Create your P2P.new Account";
        subheading = "Join us for secure peer-to-peer payments.";
    } else if (mode === 'payroll') {
        heading = "Create your PayZoll Payroll Account";
        subheading = "Join us to simplify your crypto payroll.";
    }

    return (
        <>
            <h2 className="text-xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-200">
                {heading}
            </h2>
            <p className="mt-2 max-w-sm text-sm sm:text-xl text-neutral-600 dark:text-neutral-300">
                {subheading}
            </p>
            <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
                {apiError && <p className="mb-4 text-sm sm:text-lg text-red-600 dark:text-red-400">{apiError}</p>}
                {successMessage && <p className="mb-4 text-sm sm:text-lg text-green-600 dark:text-green-400">{successMessage}</p>}

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="email" className="text-sm sm:text-lg">Email Address</Label>
                    <Input id="email" placeholder="you@company.com" type="email" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })} />
                    {errors.email && <p className="text-sm sm:text-lg text-red-500">{errors.email.message}</p>}
                </LabelInputContainer>

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="password" className="text-sm sm:text-lg">Password</Label>
                    <Input id="password" placeholder="••••••••" type="password" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("password", { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })} />
                    {errors.password && <p className="text-sm sm:text-lg text-red-500">{errors.password.message}</p>}
                </LabelInputContainer>

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="confirmPassword" className="text-sm sm:text-lg">Confirm Password</Label>
                    <Input id="confirmPassword" placeholder="••••••••" type="password" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("confirmPassword", { required: "Please confirm your password", validate: value => value === watch("password") || "Passwords do not match" })} />
                    {errors.confirmPassword && <p className="text-sm sm:text-lg text-red-500">{errors.confirmPassword.message}</p>}
                </LabelInputContainer>

                {/* Conditionally render either Company Name or Username based on mode */}
                <LabelInputContainer className="mb-8">
                    {mode === 'p2p' ? (
                        <>
                            <Label htmlFor="username" className="text-sm sm:text-lg">Username</Label>
                            <Input
                                id="username"
                                placeholder="Your username"
                                type="text"
                                className="h-10 sm:h-12 text-sm sm:text-lg"
                                {...register("company", { required: "Username is required" })}
                            />
                            {errors.company && <p className="text-sm sm:text-lg text-red-500">{errors.company?.message}</p>}
                        </>
                    ) : (
                        <>
                            <Label htmlFor="company" className="text-sm sm:text-lg">Company Name</Label>
                            <Input
                                id="company"
                                placeholder="Your Company Inc."
                                type="text"
                                className="h-10 sm:h-12 text-sm sm:text-lg"
                                {...register("company", { required: "Company name is required" })}
                            />
                            {errors.company && <p className="text-sm sm:text-lg text-red-500">{errors.company?.message}</p>}
                        </>
                    )}
                </LabelInputContainer>

                <button
                    className="group/btn relative block h-10 sm:h-12 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    type="submit"
                    disabled={isLoading}
                >
                    <span className="text-sm sm:text-lg">
                        {isLoading ? "Creating Account..." : "Sign up"} &rarr;
                    </span>
                    <BottomGradient />
                </button>

                <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                <p className="mt-4 text-center text-sm sm:text-lg text-neutral-600 dark:text-neutral-300">
                    Already have an account?{" "}
                    <button type="button" onClick={() => setAuthStep("login")} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Login
                    </button>
                </p>
            </form>
        </>
    );
};

// --- Forgot Password Form Component ---
const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ formMethods, onSubmit, isLoading, apiError, successMessage, setAuthStep }) => {
    const { register, handleSubmit, formState: { errors } } = formMethods;
    return (
        <>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                Forgot Password
            </h2>
            <p className="mt-2 max-w-sm text-sm sm:text-lg text-neutral-600 dark:text-neutral-300">
                Enter your email address and we'll send you an OTP to reset your password.
            </p>
            <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
                {apiError && <p className="mb-4 text-sm sm:text-lg text-red-600 dark:text-red-400">{apiError}</p>}
                {successMessage && <p className="mb-4 text-sm sm:text-lg text-green-600 dark:text-green-400">{successMessage}</p>}

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="forgot-email" className="text-sm sm:text-lg">Email Address</Label>
                    <Input id="forgot-email" placeholder="you@company.com" type="email" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" } })} />
                    {errors.email && <p className="text-sm sm:text-lg text-red-500">{errors.email.message}</p>}
                </LabelInputContainer>

                <button
                    className="group/btn relative block h-10 sm:h-12 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    type="submit"
                    disabled={isLoading}
                >
                    <span className="text-sm sm:text-lg">
                        {isLoading ? "Sending OTP..." : "Send OTP"} &rarr;
                    </span>
                    <BottomGradient />
                </button>

                <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                <p className="mt-4 text-center text-sm sm:text-lg text-neutral-600 dark:text-neutral-300">
                    Remembered your password?{" "}
                    <button type="button" onClick={() => setAuthStep("login")} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Login
                    </button>
                </p>
            </form>
        </>
    );
};

// --- Reset Password Form Component ---
const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ formMethods, onSubmit, isLoading, apiError, successMessage, setAuthStep, userEmailForOtp }) => {
    const { register, handleSubmit, formState: { errors }, getValues } = formMethods;
    return (
        <>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-200">
                Reset Your Password
            </h2>
            <p className="mt-2 max-w-sm text-sm sm:text-lg text-neutral-600 dark:text-neutral-300">
                Enter the OTP sent to {userEmailForOtp || 'your email'} and set a new password.
            </p>
            <form className="my-8" onSubmit={handleSubmit(onSubmit)}>
                {apiError && <p className="mb-4 text-sm sm:text-lg text-red-600 dark:text-red-400">{apiError}</p>}
                {successMessage && <p className="mb-4 text-sm sm:text-lg text-green-600 dark:text-green-400">{successMessage}</p>}

                <LabelInputContainer className="mb-4">
                    <Label htmlFor="otp" className="text-sm sm:text-lg">OTP</Label>
                    <Input id="otp" placeholder="Enter OTP" type="text" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("otp", { required: "OTP is required" })} />
                    {errors.otp && <p className="text-sm sm:text-lg text-red-500">{errors.otp.message}</p>}
                </LabelInputContainer>
                <LabelInputContainer className="mb-4">
                    <Label htmlFor="reset-password" className="text-sm sm:text-lg">New Password</Label>
                    <Input id="reset-password" placeholder="••••••••" type="password" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("password", { required: "New password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })} />
                    {errors.password && <p className="text-sm sm:text-lg text-red-500">{errors.password.message}</p>}
                </LabelInputContainer>
                <LabelInputContainer className="mb-8">
                    <Label htmlFor="reset-confirmPassword" className="text-sm sm:text-lg">Confirm New Password</Label>
                    <Input id="reset-confirmPassword" placeholder="••••••••" type="password" className="h-10 sm:h-12 text-sm sm:text-lg" {...register("confirmPassword", { required: "Please confirm your new password", validate: value => value === getValues("password") || "Passwords do not match" })} />
                    {errors.confirmPassword && <p className="text-sm sm:text-lg text-red-500">{errors.confirmPassword.message}</p>}
                </LabelInputContainer>

                <button
                    className="group/btn relative block h-10 sm:h-12 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
                    type="submit"
                    disabled={isLoading}
                >
                    <span className="text-sm sm:text-lg">
                        {isLoading ? "Resetting..." : "Reset Password"} &rarr;
                    </span>
                    <BottomGradient />
                </button>

                <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

                <p className="mt-4 text-center text-sm sm:text-lg text-neutral-600 dark:text-neutral-300">
                    Changed your mind?{" "}
                    <button type="button" onClick={() => setAuthStep("login")} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Back to Login
                    </button>
                </p>
            </form>
        </>
    );
};

export {
    LoginForm,
    RegisterForm,
    ResetPasswordForm,
    ForgotPasswordForm
}