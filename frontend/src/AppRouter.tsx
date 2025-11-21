import React from "react";
import {
  Route,
  Routes
} from "react-router-dom";
import LandingPage from "./pages/landing";
import JoinRequestPage from "./pages/join-request";
import HubAccessRequestPage from "./pages/hub-access-request";
import HubStatusPage from "./pages/hub-status";
import RealtimeSignaturePage from "./pages/realtime-signature";
import ApproveJoin from "./pages/approve-join";
import ManageUsers from "./pages/ManageUsers";
import HubController from "./pages/hub-controller";
import { AdminRoute } from "./components/AdminRoute";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/join-request" element={<JoinRequestPage />} />
      <Route path="/hub-access-request" element={<HubAccessRequestPage/>}/>
      <Route path="/hub-access-status" element={<HubStatusPage/>}/>
      <Route path="/realtime-signature" element={<RealtimeSignaturePage />}/>
      <Route path="/approve-join" element={<AdminRoute><ApproveJoin /></AdminRoute>} />
      <Route path="/manage-users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
      <Route path="/hub-controller" element={<AdminRoute><HubController /></AdminRoute>} />
      {/* Add more routes as needed */}
    </Routes>
  )
}