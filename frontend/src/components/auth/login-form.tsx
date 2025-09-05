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
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);

  const { login, isLoading } = useAuth();

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

    if (!formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <Card className="w-full border-border/20 bg-card/50 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription className="text-base">
          Sign in to access your gaming library
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your password"
                className={`pl-10 pr-10 h-12 transition-all duration-200 ${
                  fieldFocus === "password"
                    ? "ring-2 ring-primary/50 border-primary/50"
                    : ""
                }`}
                required
                autoComplete="current-password"
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
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
            disabled={isLoading || !formData.email || !formData.password}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
