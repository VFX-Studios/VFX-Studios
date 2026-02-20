/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AISetlistGenerator from './pages/AISetlistGenerator';
import Achievements from './pages/Achievements';
import Admin from './pages/Admin';
import AdminTestDashboard from './pages/AdminTestDashboard';
import AgentDashboard from './pages/AgentDashboard';
import Analytics from './pages/Analytics';
import Auth from './pages/Auth';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import CollaborationRoom from './pages/CollaborationRoom';
import CreatorOnboarding from './pages/CreatorOnboarding';
import CreatorPro from './pages/CreatorPro';
import Dashboard from './pages/Dashboard';
import DeploymentCenter from './pages/DeploymentCenter';
import FeatureAudit from './pages/FeatureAudit';
import FontMarketplace from './pages/FontMarketplace';
import Home from './pages/Home';
import Leaderboards from './pages/Leaderboards';
import LiveStream from './pages/LiveStream';
import Marketplace from './pages/Marketplace';
import Partnerships from './pages/Partnerships';
import PerformanceGallery from './pages/PerformanceGallery';
import Portfolio from './pages/Portfolio';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import SEOSitemap from './pages/SEOSitemap';
import SOC2Compliance from './pages/SOC2Compliance';
import SetlistEditor from './pages/SetlistEditor';
import ShareCreation from './pages/ShareCreation';
import Storyboard from './pages/Storyboard';
import StyleMarketplace from './pages/StyleMarketplace';
import Terms from './pages/Terms';
import Tutorial from './pages/Tutorial';
import TutorialDetail from './pages/TutorialDetail';
import Tutorials from './pages/Tutorials';
import VideoStudio from './pages/VideoStudio';
import VisualEffects from './pages/VisualEffects';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AISetlistGenerator": AISetlistGenerator,
    "Achievements": Achievements,
    "Admin": Admin,
    "AdminTestDashboard": AdminTestDashboard,
    "AgentDashboard": AgentDashboard,
    "Analytics": Analytics,
    "Auth": Auth,
    "Blog": Blog,
    "BlogPost": BlogPost,
    "CollaborationRoom": CollaborationRoom,
    "CreatorOnboarding": CreatorOnboarding,
    "CreatorPro": CreatorPro,
    "Dashboard": Dashboard,
    "DeploymentCenter": DeploymentCenter,
    "FeatureAudit": FeatureAudit,
    "FontMarketplace": FontMarketplace,
    "Home": Home,
    "Leaderboards": Leaderboards,
    "LiveStream": LiveStream,
    "Marketplace": Marketplace,
    "Partnerships": Partnerships,
    "PerformanceGallery": PerformanceGallery,
    "Portfolio": Portfolio,
    "Pricing": Pricing,
    "Profile": Profile,
    "SEOSitemap": SEOSitemap,
    "SOC2Compliance": SOC2Compliance,
    "SetlistEditor": SetlistEditor,
    "ShareCreation": ShareCreation,
    "Storyboard": Storyboard,
    "StyleMarketplace": StyleMarketplace,
    "Terms": Terms,
    "Tutorial": Tutorial,
    "TutorialDetail": TutorialDetail,
    "Tutorials": Tutorials,
    "VideoStudio": VideoStudio,
    "VisualEffects": VisualEffects,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};