// src/pages/Landing.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Landing() {
  const router = useNavigate();
  return (
    <main className="landingPageContainer" role="main">
      <header>
        <nav aria-label="Primary navigation">
          <h2>Echo</h2>

          <div className="navList" role="navigation" aria-hidden={false}>
            {/* Join as Guest - using Link so keyboard users can navigate */}
            <Link to="/meet/a23kqws" className="guestBtn" aria-label="Join as guest">
              <p onClick={()=>{
                router("/meet/a23kqws");
              }}>Join as Guest</p>
            </Link>

            <Link to="/sign-up" className="navLink">
              <p>Register</p>
            </Link>

            <Link to="/auth" className="navLink primary">
              <p>Login</p>
            </Link>
          </div>
        </nav>
      </header>

      <section className="landingMainContainer" aria-labelledby="hero-heading">
        <div>
          <h1 id="hero-heading">
            <span style={{ color: "rgb(3 162 211)" }}>Connect</span> With Your Loved
            Ones
          </h1>
          <p>Cover a distance by Echo</p>

          <div role="button" aria-label="Get started">
            <Link to="/home">
              Get Started
            </Link>
          </div>
        </div>

        <div>
          <img
            src="/mobile.png"
            alt="Mobile preview of Echo app"
            loading="lazy"
            width="400"
            height="800"
          />
        </div>
      </section>
    </main>
  );
}
