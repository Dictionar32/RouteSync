export type AuthForm = {
  Login: {
    email: string
    password: string
  }

  Register: {
    name: string
    email: string
    password: string
    passwordConfirmation: string
  }

  ForgotPassword: {
    email: string
  }

  ResetPassword: {
    email: string
    password: string
    passwordConfirmation: string
  }

  SocialLogin: {
    provider: string
    accessToken: string
  }
}