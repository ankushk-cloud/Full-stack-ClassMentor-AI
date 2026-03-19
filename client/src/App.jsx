import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path='/login' element={<Login/>} />
      <Route path='/register' element={<Register/>} />
      <Route path='/forgot-password' element={<ForgetPassword/>} />
      <Route path='/reset-password' element={<ResetPassword/>} />
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <Home/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/chat'
        element={
          <ProtectedRoute>
            <Chat/>
          </ProtectedRoute>
        }
      />
      <Route
        path='/profile'
        element={
          <ProtectedRoute>
            <Profile/>
          </ProtectedRoute>
        }
      />
      <Route 
        path='*'
        element={
          <Navigate to="/" replace/>
        }
      />
    </Routes>
  )
}

export default App
