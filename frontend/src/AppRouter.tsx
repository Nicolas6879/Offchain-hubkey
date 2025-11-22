import React from "react";
import {
  Route,
  Routes
} from "react-router-dom";
import LandingPage from "./pages/landing";
import JoinRequestPage from "./pages/join-request";
import ApproveJoin from "./pages/approve-join";
import ManageUsers from "./pages/ManageUsers";
import { AdminRoute } from "./components/AdminRoute";
import CreateEvent from "./pages/CreateEvent";
import EventList from "./pages/EventList";
import Events from "./pages/Events";
import EditEvent from "./pages/EditEvent";
import EventDetail from "./pages/EventDetail";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import WalletRegistration from "./pages/WalletRegistration";
import QRScan from "./pages/QRScan";
import Profile from "./pages/Profile";
import Loja from "./pages/Loja";
import ProductDetail from "./pages/ProductDetail";
import ManageProducts from "./pages/ManageProducts";
import SalesControl from "./pages/SalesControl";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/wallet-register" element={<WalletRegistration />} />
      <Route path="/scan/:eventId/:token" element={<QRScan />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/join-request" element={<JoinRequestPage />} />
      
      {/* Public Events Page - New UI with filters */}
      <Route path="/events" element={<Events />} />
      <Route path="/events/:id" element={<EventDetail />} />
      <Route path="/evento/:id" element={<EventDetail />} />
      
      {/* Marketplace Routes */}
      <Route path="/loja" element={<Loja />} />
      <Route path="/loja/:id" element={<ProductDetail />} />
      
      {/* Admin Routes */}
      <Route path="/approve-join" element={<AdminRoute><ApproveJoin /></AdminRoute>} />
      <Route path="/manage-users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
      <Route path="/create-event" element={<AdminRoute><CreateEvent /></AdminRoute>} /> 
      <Route path="/event-list" element={<AdminRoute><EventList /></AdminRoute>} />
      <Route path="/event-list/edit/:id" element={<AdminRoute><EditEvent /></AdminRoute>} />
      <Route path="/manage-products" element={<AdminRoute><ManageProducts /></AdminRoute>} />
      <Route path="/sales-control" element={<AdminRoute><SalesControl /></AdminRoute>} />
      
      {/* Add more routes as needed */}
    </Routes>
  )
}