import { SignUp } from '@clerk/nextjs'

import { AuthShell } from '@/components/auth-shell'

const SignUpPage = () => {
    return (
        <AuthShell
            title="Create your account"
            description="Start tracking income and expenses in under a minute."
        >
            <SignUp path="/sign-up" />
        </AuthShell>
    )
}

export default SignUpPage
