import { useState, useRef, useEffect } from "react"
import Head from "next/head"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import { isValidEmail } from "@/lib/isValidEmail"
import { magicClient } from "@/lib/magicClient"

import styles from "@/styles/Login.module.css"

const Login = () => {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState<boolean>(false)

  // create a ref for the email input
  const emailInputRef = useRef<HTMLInputElement>(null)

  // state for error message if email is invalid
  const [userMsg, setUserMsg] = useState<string | null>(null)

  // if emailInput is being typed in, clear the user message
  const handleEmailInputTyping = () => {
    setIsLoading(false)
    setUserMsg(null)
  }

  // used to set the loading state to false when the route changes
  useEffect(() => {
    const handleComplete = () => {
      setIsLoading(false)
    }

    router.events.on("routeChangeComplete", handleComplete)
    router.events.on("routeChangeError", handleComplete)

    return () => {
      router.events.off("routeChangeComplete", handleComplete)
      router.events.off("routeChangeError", handleComplete)
    }
  }, [router])

  // fn to handle login with email
  const handleLoginWithEmail = async () => {
    // get the value from the email input
    const emailInput = emailInputRef.current?.value.trim() || null

    // need to check if the email is valid, if not, show an error message
    if (!emailInput || emailInput === "") {
      setUserMsg("Please enter an email address")
      setIsLoading(false)
      return
    }

    if (!isValidEmail(emailInput)) {
      setUserMsg("Please enter a valid email address")
      setIsLoading(false)
      return
    }

    // clear the user message
    setUserMsg(null)

    // if the email is valid, start the login process

    // if the email is valid, send the email to Magic
    try {
      setIsLoading(true)
      // send the email to Magic, and get the DID token
      const didToken = await magicClient?.auth.loginWithMagicLink({
        email: emailInput,
      })

      // if the DID token is returned, attempt to login via the /api/auth route
      if (didToken) {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${didToken}`,
            "Content-Type": "application/json",
          },
        })

        const loggedInResponse = await response.json()

        // if status is 200, redirect to the home page
        if (loggedInResponse.authSuccess === true) {
          router.push("/")
        } else {
          setIsLoading(false)
          setUserMsg("Something went wrong logging in")
        }
      }
    } catch (error) {
      console.error("Error when logging in with Magic: ", error)
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Netflix - Sign In</title>
        <meta
          name="description"
          content="Netflix clone built by Curtis Warcup with Next.js, TypeScript, GraphQL, and Supabase."
        />
        <meta name="og:title" content="Netflix - Sign In" />
        <meta
          name="og:description"
          content="Netflix clone built by Curtis Warcup with Next.js, TypeScript, GraphQL, and Supabase."
        />
        <meta name="og:image" content="/static/netflix.svg" />
        <meta
          name="og:url"
          content="https://netflix-clone-cwarcup.vercel.app"
        />
      </Head>
      <header className={styles.header}>
        <div className={styles.headerWrapper}>
          <Link className={styles.logoLink} href="/">
            <div className={styles.logoWrapper}>
              <Image
                src="/static/netflix.svg"
                alt="Netflix logo"
                width={128}
                height={34}
                priority
              />
            </div>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.mainWrapper}>
          <h1 className={styles.signinHeader}>Sign In</h1>
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault()
              handleLoginWithEmail()
            }}
          >
            <label className={styles.emailLabel} htmlFor="email">
              Email
            </label>

            <input
              className={styles.emailInput}
              type="text"
              placeholder="Enter your email"
              ref={emailInputRef}
              onChange={handleEmailInputTyping}
              aria-label="Email Address"
            />

            {userMsg && <p className={styles.userMsg}>{userMsg}</p>}

            <button
              className={styles.loginBtn}
              type="submit"
              onClick={handleLoginWithEmail}
              aria-label="Sign In"
            >
              {isLoading ? "Loading..." : "Sign In"}
            </button>
            {/* remember me input and text, is not functional */}
            <div className={styles.rememberMeWrapper}>
              <div className={styles.rememberMeInputWrapper}>
                <input
                  className={styles.rememberMeInput}
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  value="rememberMe"
                />
                <label className={styles.rememberMeLabel} htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              <Link href="/" className={styles.helpLink}>
                Need help?
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

export default Login
