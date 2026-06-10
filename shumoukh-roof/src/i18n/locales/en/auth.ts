// auth namespace keys — login and registration pages
export const auth = {
  // Login
  "auth.loginTitle": "Sign In",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.loginButton": "Sign in",
  "auth.loggingIn": "Signing in...",
  "auth.or": "or",
  "auth.google": "Google",
  "auth.noAccount": "Don't have an account?",

  // Registration
  "auth.createAccount": "Create Account",
  "auth.registerSubtitle": "Join Shumoukh ERP",
  "auth.freeTrialBanner": "Free full-featured subscription for 6 months",
  "auth.name": "Name",
  "auth.namePlaceholder": "Mohammad Ahmad",
  "auth.creatingAccount": "Creating account...",
  "auth.haveAccount": "Already have an account?",
  "auth.loginLink": "Sign in",

  // Error messages
  "auth.error.userNotFound": "This email is not registered",
  "auth.error.wrongPassword": "Incorrect password",
  "auth.error.invalidCredential": "Incorrect email or password",
  "auth.error.invalidEmail": "Invalid email address",
  "auth.error.tooManyRequests": "Too many attempts, please try again later",
  "auth.error.loginFailed": "Failed to sign in",
  "auth.error.googleLoginFailed": "Failed to sign in with Google",
  "auth.error.nameRequired": "Please enter your name",
  "auth.error.passwordTooShort": "Password must be at least 6 characters",
  "auth.error.registerFailed": "Failed to create account",
} as const;
