// LocationSelector.jsx
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, MapPin, Loader2 } from "lucide-react";
import "./LocationSelector.css";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000/api"
  : "https://kalludevakunta-fpo-website.onrender.com/api";

// Client-side cache to prevent duplicate fetches
const locationCache = {
  states: null,
  districts: {}, // key: stateName
  mandals: {},   // key: stateName_districtName
  villages: {},  // key: stateName_districtName_mandalName
};

// Internal reusable SearchableSelect component
function SearchableSelect({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select option",
  disabled = false,
  loading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    String(opt).toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (opt) => {
    onChange(opt);
    setIsOpen(false);
  };

  return (
    <div className="searchable-select-wrapper" ref={containerRef}>
      {label && <label className="searchable-select-label">{label}</label>}
      
      <button
        type="button"
        className="searchable-select-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
      >
        <span className={`searchable-select-value ${!value ? "searchable-select-placeholder" : ""}`}>
          {value || placeholder}
        </span>
        <span className="searchable-select-icons">
          {loading ? (
            <Loader2 className="searchable-select-spinner" size={16} />
          ) : (
            <ChevronDown size={16} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          )}
        </span>
      </button>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search-container">
            <input
              ref={searchInputRef}
              type="text"
              className="searchable-select-search-input"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul className="searchable-select-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    className={`searchable-select-option ${opt === value ? "selected" : ""}`}
                    onClick={() => handleSelect(opt)}
                  >
                    {opt}
                  </button>
                </li>
              ))
            ) : (
              <li className="searchable-select-no-options">No matches found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// Main LocationSelector Component
export default function LocationSelector({ value = {}, onChange }) {
  const { state = "", district = "", mandal = "", village = "" } = value;

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [villages, setVillages] = useState([]);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingMandals, setLoadingMandals] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // 1. Fetch States on Mount
  useEffect(() => {
    const loadStates = async () => {
      if (locationCache.states) {
        setStates(locationCache.states);
        return;
      }

      setLoadingStates(true);
      try {
        const res = await fetch(`${API_BASE}/location/states`);
        const data = await res.json();
        if (data.success && data.states) {
          locationCache.states = data.states;
          setStates(data.states);
        }
      } catch (err) {
        console.error("Failed to load states:", err);
      } finally {
        setLoadingStates(false);
      }
    };
    loadStates();
  }, []);

  // 2. Fetch Districts when State changes
  useEffect(() => {
    if (!state) {
      setDistricts([]);
      return;
    }

    const loadDistricts = async () => {
      if (locationCache.districts[state]) {
        setDistricts(locationCache.districts[state]);
        return;
      }

      setLoadingDistricts(true);
      try {
        const res = await fetch(`${API_BASE}/location/districts?state=${encodeURIComponent(state)}`);
        const data = await res.json();
        if (data.success && data.districts) {
          locationCache.districts[state] = data.districts;
          setDistricts(data.districts);
        }
      } catch (err) {
        console.error(`Failed to load districts for ${state}:`, err);
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, [state]);

  // 3. Fetch Mandals when District changes
  useEffect(() => {
    if (!state || !district) {
      setMandals([]);
      return;
    }

    const cacheKey = `${state}_${district}`;
    const loadMandals = async () => {
      if (locationCache.mandals[cacheKey]) {
        setMandals(locationCache.mandals[cacheKey]);
        return;
      }

      setLoadingMandals(true);
      try {
        const res = await fetch(
          `${API_BASE}/location/mandals?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`
        );
        const data = await res.json();
        if (data.success && data.mandals) {
          locationCache.mandals[cacheKey] = data.mandals;
          setMandals(data.mandals);
        }
      } catch (err) {
        console.error(`Failed to load mandals for ${district}:`, err);
      } finally {
        setLoadingMandals(false);
      }
    };
    loadMandals();
  }, [state, district]);

  // 4. Fetch Villages when Mandal changes
  useEffect(() => {
    if (!state || !district || !mandal) {
      setVillages([]);
      return;
    }

    const cacheKey = `${state}_${district}_${mandal}`;
    const loadVillages = async () => {
      if (locationCache.villages[cacheKey]) {
        setVillages(locationCache.villages[cacheKey]);
        return;
      }

      setLoadingVillages(true);
      try {
        const res = await fetch(
          `${API_BASE}/location/villages?state=${encodeURIComponent(state)}&district=${encodeURIComponent(
            district
          )}&mandal=${encodeURIComponent(mandal)}`
        );
        const data = await res.json();
        if (data.success && data.villages) {
          locationCache.villages[cacheKey] = data.villages;
          setVillages(data.villages);
        }
      } catch (err) {
        console.error(`Failed to load villages for ${mandal}:`, err);
      } finally {
        setLoadingVillages(false);
      }
    };
    loadVillages();
  }, [state, district, mandal]);

  const handleStateChange = (selectedState) => {
    onChange({
      state: selectedState,
      district: "",
      mandal: "",
      village: "",
    });
  };

  const handleDistrictChange = (selectedDistrict) => {
    onChange({
      state,
      district: selectedDistrict,
      mandal: "",
      village: "",
    });
  };

  const handleMandalChange = (selectedMandal) => {
    onChange({
      state,
      district,
      mandal: selectedMandal,
      village: "",
    });
  };

  const handleVillageChange = (selectedVillage) => {
    onChange({
      state,
      district,
      mandal,
      village: selectedVillage,
    });
  };

  return (
    <div className="location-selector-container">
      <SearchableSelect
        label="State / రాష్ట్రం *"
        value={state}
        options={states}
        onChange={handleStateChange}
        placeholder="Select State"
        loading={loadingStates}
      />
      <SearchableSelect
        label="District / జిల్లా *"
        value={district}
        options={districts}
        onChange={handleDistrictChange}
        placeholder={state ? "Select District" : "Select State first"}
        disabled={!state}
        loading={loadingDistricts}
      />
      <SearchableSelect
        label="Mandal / తాలూకా/మండలం *"
        value={mandal}
        options={mandals}
        onChange={handleMandalChange}
        placeholder={district ? "Select Mandal" : "Select District first"}
        disabled={!district}
        loading={loadingMandals}
      />
      <SearchableSelect
        label="Village / గ్రామం *"
        value={village}
        options={villages}
        onChange={handleVillageChange}
        placeholder={mandal ? "Select Village" : "Select Mandal first"}
        disabled={!mandal}
        loading={loadingVillages}
      />
    </div>
  );
}
