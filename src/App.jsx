import { useState, useEffect } from "react";
import Navbar    from "./components/Navbar/Navbar";
import Footer    from "./components/Footer/Footer";
import AppRoutes from "./routes/AppRoutes";
import { useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import "./index.css";

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet connection restored! / ఇంటర్నెట్ కనెక్టివిటీ పునరుద్ధరించబడింది.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("You are currently offline. / మీరు ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నారు.", { id: "offline-toast", duration: 5000 });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    // Scroll to top on page change
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target); // Stop observing once animated
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    const selector = ".fade-up, .fade-up-1, .fade-up-2, .fade-up-3, .fade-up-4, .fade-up-5, .fade-up-6, .fade-in, .scale-in";

    // Function to search and observe elements
    const observeElements = (root = document) => {
      if (root.nodeType === Node.ELEMENT_NODE && root.matches && root.matches(selector)) {
        observer.observe(root);
      }
      if (root.querySelectorAll) {
        const animatedElements = root.querySelectorAll(selector);
        animatedElements.forEach((el) => {
          observer.observe(el);
        });
      }
    };

    // Initial sweep of already rendered elements
    observeElements();

    // Observe future dynamic DOM mutations (for lists loaded via API)
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            observeElements(node);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);

  return (
    <>
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(13, 35, 21, 0.95)",
            color: "#e0e7e1",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(8px)",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
            padding: "12px 16px"
          },
          success: {
            iconTheme: {
              primary: "#16a34a",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff"
            }
          }
        }}
      />
      {!isOnline && (
        <div style={{
          background: "#ef4444",
          color: "#fff",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: "13px",
          fontWeight: "600",
          position: "sticky",
          top: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}>
          <span>⚠️ You are currently offline. Working in offline mode. / మీరు ప్రస్తుతం ఆఫ్‌లైన్‌లో ఉన్నారు.</span>
        </div>
      )}
      {!isAdminPage && <Navbar />}
      <AppRoutes />
      {!isAdminPage && <Footer />}
    </>
  );
}

export default App;