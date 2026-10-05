import { SignIn } from '@clerk/nextjs'

import { AuthShell } from '@/components/auth-shell'

const SignInPage = () => {
    return (
        <AuthShell
            title="Welcome back"
            description="Sign in to pick up where you left off."
        >
            <SignIn path="/sign-in" />
        </AuthShell>
    )
}

export default SignInPage
