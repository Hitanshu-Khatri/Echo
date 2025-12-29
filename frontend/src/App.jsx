
import './App.css';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import LandingPage from './pages/landing.jsx';
import Authentication from './pages/sign-in/SignIn.jsx';
import SignUp from './pages/sign-up/SignUp.jsx';
import VideoMeetComponent from './pages/VideoMeet.jsx';
import History from './pages/history.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import HomeComponent from './pages/home.jsx';

function App() {


  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/home' element={<HomeComponent />} />
            <Route path='/' element={<LandingPage />} />
            <Route path='/login' element={<Authentication />} />
            <Route path='/sign-up' element={<SignUp />} />
            <Route path='/meet/:url' element={<VideoMeetComponent />} />
            <Route path='/history' element={<History />} />
          </Routes>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App
