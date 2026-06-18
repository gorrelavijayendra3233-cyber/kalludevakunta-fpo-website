import { useEffect } from "react";
import Navbar    from "./components/Navbar/Navbar";
import Footer    from "./components/Footer/Footer";
import AppRoutes from "./routes/AppRoutes";
import { useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./index.css";

function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

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
      {!isAdminPage && <Navbar />}
      <AppRoutes />
      {!isAdminPage && <Footer />}
    </>
  );
}

export default App;