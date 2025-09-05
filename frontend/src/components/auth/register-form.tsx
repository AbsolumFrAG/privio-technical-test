import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { Check, Eye, EyeOff, Loader2, Lock, Mail, User, X } from "lucide-react";
import { useState } from "react";

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);

  const { register, isLoading } = useAuth();

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      // Clear error when user starts typing
      if (error) setError(null);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.email ||
      !formData.username ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("All fields are required");
      return;
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await register(formData.email, formData.username, formData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  // Password validation helpers
  const passwordsMatch =
    formData.password &&
    formData.confirmPassword &&
    formData.password === formData.confirmPassword;
  const passwordsNoMatch =
    formData.confirmPassword && formData.password !== formData.confirmPassword;
  const passwordStrong = formData.password.length >= 6;
  const usernameValid = formData.username.length >= 3;

  return (
    <Card className="w-full border-border/20 bg-card/50 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold">Join GameTracker</CardTitle>
        <CardDescription className="text-base">
          Create your account to start tracking your games
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground/80"
            >
              Email Address
            </label>
            <div
              className={`relative transition-all duration-200 ${
                fieldFocus === "email" ? "transform scale-[1.02]" : ""
              }`}
            >
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                onFocus={() => setFieldFocus("email")}
                onBlur={() => setFieldFocus(null)}
                disabled={isLoading}
                placeholder="Enter your email address"
                className={`pl-10 h-12 transition-all duration-200 ${
                  fieldFocus === "email"
                    ? "ring-2 ring-primary/50 border-primary/50"
                    : ""
                }`}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-foreground/80"
            >
              Username
            </label>
            <div
              className={`relative transition-all duration-200 ${
                fieldFocus === "username" ? "transform scale-[1.02]" : ""
              }`}
            >
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={handleChange("username")}
                onFocus={() => setFieldFocus("username")}
                onBlur={() => setFieldFocus(null)}
                disabled={isLoading}
                placeholder="Choose a unique username"
                className={`pl-10 pr-10 h-12 transition-all duration-200 ${
                  fieldFocus === "username"
                    ? "ring-2 ring-primary/50 border-primary/50"
                    : usernameValid && formData.username
                    ? "ring-2 ring-green-500/50 border-green-500/50"
                    : formData.username && !usernameValid
                    ? "ring-2 ring-red-500/50 border-red-500/50"
                    : ""
                }`}
                required
                autoComplete="username"
                minLength={3}
              />
              {formData.username && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {usernameValid ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {formData.username && !usernameValid && (
              <p className="text-xs text-red-500">
                Username must be at least 3 characters long
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground/80"
            >
              Password
            </label>
            <div
              className={`relative transition-all duration-200 ${
                fieldFocus === "password" ? "transform scale-[1.02]" : ""
              }`}
            >
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange("password")}
                onFocus={() => setFieldFocus("password")}
                onBlur={() => setFieldFocus(null)}
                disabled={isLoading}
                placeholder="Create a strong password"
                className={`pl-10 pr-10 h-12 transition-all duration-200 ${
                  fieldFocus === "password"
                    ? "ring-2 ring-primary/50 border-primary/50"
                    : passwordStrong && formData.password
                    ? "ring-2 ring-green-500/50 border-green-500/50"
                    : formData.password && !passwordStrong
                    ? "ring-2 ring-red-500/50 border-red-500/50"
                    : ""
                }`}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {formData.password && !passwordStrong && (
              <p className="text-xs text-red-500">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-foreground/80"
            >
              Confirm Password
            </label>
            <div
              className={`relative transition-all duration-200 ${
                fieldFocus === "confirmPassword" ? "transform scale-[1.02]" : ""
              }`}
            >
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                onFocus={() => setFieldFocus("confirmPassword")}
                onBlur={() => setFieldFocus(null)}
                disabled={isLoading}
                placeholder="Confirm your password"
                className={`pl-10 pr-10 h-12 transition-all duration-200 ${
                  fieldFocus === "confirmPassword"
                    ? "ring-2 ring-primary/50 border-primary/50"
                    : passwordsMatch
                    ? "ring-2 ring-green-500/50 border-green-500/50"
                    : passwordsNoMatch
                    ? "ring-2 ring-red-500/50 border-red-500/50"
                    : ""
                }`}
                required
                autoComplete="new-password"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {formData.confirmPassword && (
                  <div>
                    {passwordsMatch ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : passwordsNoMatch ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {passwordsNoMatch && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-lg animate-in fade-in-0 slide-in-from-top-1 duration-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full" />
                {error}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none mt-6"
            disabled={
              isLoading ||
              !formData.email ||
              !formData.username ||
              !formData.password ||
              !formData.confirmPassword ||
              !usernameValid ||
              !passwordStrong ||
              !passwordsMatch
            }
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </div>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
