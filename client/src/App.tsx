import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Library from "./pages/Library";
import Contribute from "./pages/Contribute";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/bibliotheque" component={Library} />
    <Route path="/contribuer" component={Contribute} />
    <Route path="/admin" component={Admin} />
    <Route path="/auth" component={Auth} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
