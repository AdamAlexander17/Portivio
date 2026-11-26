import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './admin/AdminLayout'
import Account from './admin/Account'
import { ForgotPassword, ResetPassword, Signup } from './admin/AccountAccess'
import Analytics from './admin/Analytics'
import CustomSections from './admin/CustomSections'
import Dashboard from './admin/Dashboard'
import Fonts from './admin/Fonts'
import Layouts from './admin/Layouts'
import Login from './admin/Login'
import Messages from './admin/Messages'
import Onboarding from './admin/Onboarding'
import PageTexts from './admin/PageTexts'
import ProfileEditor from './admin/ProfileEditor'
import ProjectForm from './admin/ProjectForm'
import ProjectsAdmin from './admin/ProjectsAdmin'
import SectionManager from './admin/SectionManager'
import Studio from './admin/Studio'
import Themes from './admin/Themes'
import Users from './admin/Users'
import Layout from './components/Layout'
import About from './pages/About'
import Contact from './pages/Contact'
import Home from './pages/Home'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import ProjectDetail from './pages/ProjectDetail'
import Projects from './pages/Projects'
import Services from './pages/Services'

// The pages of one portfolio, served under /u/<username>.
const sitePages = (
  <>
    <Route index element={<Home />} />
    <Route path="projects" element={<Projects />} />
    <Route path="projects/:slug" element={<ProjectDetail />} />
    <Route path="services" element={<Services />} />
    <Route path="about" element={<About />} />
    <Route path="contact" element={<Contact />} />
    <Route path="*" element={<NotFound />} />
  </>
)

export default function App() {
  return (
    <Routes>
      {/* Panel: every signed-in user manages their own portfolio; admins also manage accounts. */}
      <Route path="admin/login" element={<Login />} />
      <Route path="signup" element={<Signup />} />
      <Route path="welcome" element={<Onboarding />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<ProfileEditor />} />
        <Route path="texts" element={<PageTexts />} />
        <Route path="projects" element={<ProjectsAdmin />} />
        <Route path="projects/new" element={<ProjectForm />} />
        <Route path="projects/:id" element={<ProjectForm />} />
        <Route path="sections/:section" element={<SectionManager />} />
        <Route path="messages" element={<Messages />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="custom-sections" element={<CustomSections />} />
        <Route path="studio" element={<Studio />} />
        <Route path="editor" element={<Navigate to="/admin/studio" replace />} />
        <Route path="themes" element={<Themes />} />
        <Route path="layouts" element={<Layouts />} />
        <Route path="fonts" element={<Fonts />} />
        <Route path="users" element={<Users />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      {/* Public sites */}
      <Route path="u/:username" element={<Layout />}>
        {sitePages}
      </Route>
      {/* The product's own landing page; anything unknown goes back to it. */}
      <Route path="/" element={<Landing />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
