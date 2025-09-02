import { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Calculator, TrendingUp, Truck, MapPin, DollarSign, BarChart3, AlertCircle, CheckCircle, FileText, Settings, Users, Wrench, PiggyBank, Edit3, X, Save, Plus, Trash2, ChevronDown, CheckCheck, TrendingDown, Gauge } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

const PRIMARY_COLOR = '#152A55';
const ACCENT_COLOR = '#FFD100';

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let db;
let auth;
let app;

// Use this function to initialize firebase only once
const initializeFirebase = () => {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
};

export default function HaulyticsDashboard() {
  const [activeModal, setActiveModal] = useState(null);
  const [errors, setErrors] = useState({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);

  const initialFleetData = [{ id: '1', truckId: 'ANAX01', make: 'Scania', model: 'R500', year: 2017, type: 'Prime Mover', capacity: 34000, fuelTankSize: 400, tyreSize: '315/80R22.5', assetValue: 1740000, financing: { term: 5, interestRate: 9.0, monthlyPayment: 36120 }, insurance: 8500, licensing: 17500, tracking: 150 }];
  const initialRoutesData = [{ id: '1', routeName: 'Cape Town - Johannesburg', client: 'ABC Logistics', distance: 1400, returnDistance: 1400, productType: 'General Freight', loadsPerMonth: 8, loadsPerAnnum: 96, ratePerTon: 2.50, backloadRatePerTon: 1.50, tonnage: 28, guaranteed: true, fuelConsumption: 40, driverRate: 25, tollCosts: 850, parkingCosts: 300, otherCosts: 200, actuals: { loadsPerMonth: 8, revenue: 120000, fuelCost: 15000, otherCosts: 5000 }, kmLog: [] }];
  const initialFixedCosts = { capitalRecovery: [{ name: 'Vehicle Depreciation', amount: 4795350, frequency: 'annual' }], personnel: [{ name: 'Contract Manager', count: 1, salary: 500000, total: 500000 }], operations: [{ name: 'Office Rent', amount: 25000, frequency: 'monthly' }], overheads: [{ name: 'Head Office Allocation', amount: 166330, frequency: 'monthly' }] };
  const initialVariableCosts = { fuel: { pricePerLiter: 21.50, consumptionPer100km: 40.0 }, maintenance: { costPerKm: 0.55 }, tyres: { costPerKm: 0.42 }, tolls: { averagePerKm: 0.15 }, parking: { costPerNight: 150 } };
  const initialProfileData = { businessName: 'Your Business Name', contactPerson: 'Your Name' };

  const [fleetData, setFleetData] = useState([]);
  const [routesData, setRoutesData] = useState([]);
  const [fixedCosts, setFixedCosts] = useState({});
  const [variableCosts, setVariableCosts] = useState({});
  const [profileData, setProfileData] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    initializeFirebase();
    const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
    const signIn = async () => {
      try {
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
           await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Firebase Auth Error:", error);
      }
    };
    signIn();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setIsAuthReady(true);
      } else {
        console.log("No user is signed in.");
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const collections = {
      fleet: { state: fleetData, setter: setFleetData, initial: initialFleetData },
      routes: { state: routesData, setter: setRoutesData, initial: initialRoutesData },
      fixedCosts: { state: fixedCosts, setter: setFixedCosts, initial: initialFixedCosts },
      variableCosts: { state: variableCosts, setter: setVariableCosts, initial: initialVariableCosts },
      profile: { state: profileData, setter: setProfileData, initial: initialProfileData },
    };

    const listeners = Object.entries(collections).map(([key, { setter, initial }]) => {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/${key}/data`);
      return onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
          setter(docSnap.data().data);
        } else {
          try {
            await setDoc(docRef, { data: initial });
            console.log(`Initialized ${key} data for new user.`);
          } catch (e) {
            console.error(`Error initializing ${key} data:`, e);
          }
        }
      }, (error) => {
        console.error(`Error with ${key} listener:`, error);
      });
    });

    return () => listeners.forEach(unsub => unsub());
  }, [isAuthReady, userId]);

  const updateFirestoreData = async (collectionName, data) => {
    if (!userId) return;
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/${collectionName}/data`);
    try {
      await setDoc(docRef, { data });
    } catch (e) {
      console.error(`Error updating ${collectionName} in Firestore:`, e);
    }
  };

  const handleConfirm = (action) => {
    setConfirmAction(() => action);
    setShowConfirm(true);
  };
  const handleCancel = () => {
    setShowConfirm(false);
    setConfirmAction(null);
  };
  const handleAction = async () => {
    if (confirmAction) {
      await confirmAction();
    }
    handleCancel();
  };

  const validateFleetVehicle = (vehicle) => {
    const newErrors = {};
    if (!vehicle.truckId) newErrors.truckId = "Truck ID is required.";
    if (!vehicle.make) newErrors.make = "Make is required.";
    if (!vehicle.model) newErrors.model = "Model is required.";
    if (!vehicle.year || Number(vehicle.year) <= 0) newErrors.year = "Valid year is required.";
    if (!vehicle.assetValue || Number(vehicle.assetValue) <= 0) newErrors.assetValue = "Asset value must be a positive number.";
    return newErrors;
  };
  const addFleetVehicle = async () => {
    const newVehicle = { id: Date.now().toString(), truckId: '', make: '', model: '', year: new Date().getFullYear(), type: 'Prime Mover', capacity: 0, fuelTankSize: 0, tyreSize: '', assetValue: 0, financing: { term: 5, interestRate: 9.0, monthlyPayment: 0 }, insurance: 0, licensing: 0, tracking: 150 };
    await updateFirestoreData('fleet', [...fleetData, newVehicle]);
  };
  const removeFleetVehicle = (id) => {
    handleConfirm(() => updateFirestoreData('fleet', fleetData.filter(vehicle => vehicle.id !== id)));
  };

  const validateRoute = (route) => {
    const newErrors = {};
    if (!route.routeName) newErrors.routeName = "Route name is required.";
    if (!route.client) newErrors.client = "Client name is required.";
    if (Number(route.distance) <= 0) newErrors.distance = "Distance must be a positive number.";
    if (Number(route.loadsPerMonth) <= 0) newErrors.loadsPerMonth = "Loads per month must be a positive number.";
    if (Number(route.ratePerTon) <= 0) newErrors.ratePerTon = "Rate per ton must be a positive number.";
    return newErrors;
  };
  const addRoute = async () => {
    const lastRoute = routesData[routesData.length - 1];
    if (lastRoute) {
      const validationErrors = validateRoute(lastRoute);
      if (Object.keys(validationErrors).length > 0) {
        setErrors({ ...validationErrors, global: "Please fill in the required fields for the current route before adding a new one." });
        return;
      }
    }
    const newRoute = { id: Date.now().toString(), routeName: '', client: '', distance: 0, returnDistance: 0, productType: '', loadsPerMonth: 0, loadsPerAnnum: 0, ratePerTon: 0, backloadRatePerTon: 0, tonnage: 0, guaranteed: true, fuelConsumption: 40, driverRate: 25, tollCosts: 0, parkingCosts: 0, otherCosts: 0, actuals: { loadsPerMonth: 0, revenue: 0, fuelCost: 0, otherCosts: 0 }, kmLog: [] };
    await updateFirestoreData('routes', [...routesData, newRoute]);
    setErrors({});
  };
  const removeRoute = (id) => {
    handleConfirm(() => updateFirestoreData('routes', routesData.filter(route => route.id !== id)));
  };

  const addFixedCostItem = async (category) => {
    const newItem = category === 'personnel' ? { name: '', count: 1, salary: 0, total: 0 } : { name: '', amount: 0, frequency: 'monthly' };
    const updatedFixedCosts = { ...fixedCosts, [category]: [...fixedCosts[category], newItem] };
    await updateFirestoreData('fixedCosts', updatedFixedCosts);
  };

  const calculateTotalFixedCosts = () => {
    let total = 0;
    fixedCosts.capitalRecovery?.forEach(item => { total += Number(item.amount) || 0; });
    fixedCosts.personnel?.forEach(item => { total += (Number(item.count) || 0) * (Number(item.salary) || 0); });
    fixedCosts.operations?.forEach(item => { total += item.frequency === 'annual' ? (Number(item.amount) || 0) : (Number(item.amount) || 0) * 12; });
    fixedCosts.overheads?.forEach(item => { total += item.frequency === 'annual' ? (Number(item.amount) || 0) : (Number(item.amount) || 0) * 12; });
    return total;
  };
  const calculateTotalMonthlyLoads = () => { return routesData.reduce((sum, route) => sum + (Number(route.loadsPerMonth) || 0), 0); };
  const totalAnnualFixedCosts = useMemo(calculateTotalFixedCosts, [fixedCosts]);
  const totalMonthlyLoads = useMemo(calculateTotalMonthlyLoads, [routesData]);

  const calculateRouteFinancials = (routeData) => {
    if (!variableCosts.fuel || !variableCosts.maintenance || !variableCosts.tyres) return {};
    const loads = Number(routeData.loadsPerMonth) || 0;
    const distance = Number(routeData.returnDistance) || 0;
    const tonnage = Number(routeData.tonnage) || 0;
    const primaryRevenue = (Number(routeData.ratePerTon) || 0) * tonnage;
    const backloadRevenue = (Number(routeData.backloadRatePerTon) || 0) * tonnage;
    const revenuePerLoad = primaryRevenue + backloadRevenue;
    const revenuePerMonth = revenuePerLoad * loads;
    const fuelCost = (distance / 100) * (Number(routeData.fuelConsumption) || 0) * (Number(variableCosts.fuel.pricePerLiter) || 0);
    const maintenanceCost = distance * (Number(variableCosts.maintenance.costPerKm) || 0);
    const tyreCost = distance * (Number(variableCosts.tyres.costPerKm) || 0);
    const tollCosts = Number(routeData.tollCosts) || (distance * (Number(variableCosts.tolls?.averagePerKm) || 0));
    const driverCost = (Number(routeData.driverRate) || 0) * (distance / 80);
    const parkingCost = Number(routeData.parkingCosts) || 0;
    const otherCosts = Number(routeData.otherCosts) || 0;
    const totalVariableCostPerLoad = fuelCost + maintenanceCost + tyreCost + tollCosts + driverCost + parkingCost + otherCosts;
    const fixedCostPerLoad = totalMonthlyLoads > 0 ? (totalAnnualFixedCosts / 12) / totalMonthlyLoads : 0;
    const totalCostPerLoad = totalVariableCostPerLoad + fixedCostPerLoad;
    const profitPerLoad = revenuePerLoad - totalCostPerLoad;
    const profitMargin = revenuePerLoad > 0 ? (profitPerLoad / revenuePerLoad) * 100 : 0;
    const breakEvenLoads = Math.ceil((totalAnnualFixedCosts / 12) / (revenuePerLoad - totalVariableCostPerLoad));

    return {
      revenuePerLoad: revenuePerLoad.toFixed(2), revenuePerMonth: revenuePerMonth.toFixed(2), variableCostPerLoad: totalVariableCostPerLoad.toFixed(2),
      fixedCostPerLoad: fixedCostPerLoad.toFixed(2), totalCostPerLoad: totalCostPerLoad.toFixed(2), profitPerLoad: profitPerLoad.toFixed(2),
      profitMargin: profitMargin.toFixed(1), breakEvenLoads: breakEvenLoads
    };
  };

  const routeFinancials = useMemo(() => routesData.map(route => calculateRouteFinancials(route)), [routesData, fixedCosts, variableCosts, totalMonthlyLoads, totalAnnualFixedCosts]);
  
  const [route, setRoute] = useState({
    selectedRouteId: '', distance: '', fuelPrice: initialVariableCosts.fuel.pricePerLiter.toString(),
    fuelConsumption: initialVariableCosts.fuel.consumptionPer100km.toString(), tollCosts: '', driverRate: '300', loadRate: '', otherCosts: ''
  });
  const [routeResults, setRouteResults] = useState({});
  const [profitability, setProfitability] = useState('');

  useEffect(() => {
    if (!variableCosts.fuel || !variableCosts.maintenance || !variableCosts.tyres) return;
    const distance = parseFloat(route.distance) || 0;
    const loadRate = parseFloat(route.loadRate) || 0;
    if (distance > 0 && loadRate > 0) {
      const fuelCost = (distance / 100) * (parseFloat(route.fuelConsumption) || 0) * (parseFloat(route.fuelPrice) || 0);
      const tollCosts = parseFloat(route.tollCosts) || 0;
      const driverCost = (distance / 80) * (parseFloat(route.driverRate) || 0);
      const maintenanceCost = distance * (variableCosts.maintenance?.costPerKm || 0);
      const tyreCost = distance * (variableCosts.tyres?.costPerKm || 0);
      const otherCosts = parseFloat(route.otherCosts) || 0;
      const totalVariableCosts = fuelCost + tollCosts + driverCost + maintenanceCost + tyreCost + otherCosts;
      const revenue = loadRate;
      const profit = revenue - totalVariableCosts;
      const profitMargin = ((profit / revenue) * 100).toFixed(1);
      
      setRouteResults({
        fuelCost: fuelCost.toFixed(2), tollCosts: tollCosts.toFixed(2), driverCost: driverCost.toFixed(2),
        maintenanceCost: maintenanceCost.toFixed(2), tyreCost: tyreCost.toFixed(2),
        totalVariableCosts: totalVariableCosts.toFixed(2), revenue: revenue.toFixed(2),
        profit: profit.toFixed(2), profitMargin: profitMargin
      });
      if (parseFloat(profitMargin) >= 15) { setProfitability('excellent'); } else if (parseFloat(profitMargin) >= 10) { setProfitability('good'); } else if (parseFloat(profitMargin) >= 5) { setProfitability('marginal'); } else { setProfitability('poor'); }
    } else { setRouteResults({}); setProfitability(''); }
  }, [route, variableCosts]);

  const getProfitabilityColor = (status) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'marginal': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  const getProfitabilityIcon = (status) => {
    switch (status) {
      case 'excellent': case 'good': return <CheckCircle className="w-5 h-5" />;
      case 'marginal': case 'poor': return <AlertCircle className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };
  
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      console.log("No data to export.");
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const FleetModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Fleet Management</h3><button onClick={() => { setActiveModal(null); setErrors({}); }} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button></div>
        <div className="space-y-4">
          {fleetData.map((vehicle, index) => (
            <div key={vehicle.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3"><h4 className="font-semibold">Vehicle #{index + 1}</h4><button onClick={() => removeFleetVehicle(vehicle.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                <div><label htmlFor={`truckId-${vehicle.id}`} className="block text-xs font-medium mb-1">Truck ID<span className="text-red-500">*</span></label><input id={`truckId-${vehicle.id}`} type="text" value={vehicle.truckId} onChange={(e) => { const updated = [...fleetData]; updated[index].truckId = e.target.value; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`make-${vehicle.id}`} className="block text-xs font-medium mb-1">Make<span className="text-red-500">*</span></label><input id={`make-${vehicle.id}`} type="text" value={vehicle.make} onChange={(e) => { const updated = [...fleetData]; updated[index].make = e.target.value; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`model-${vehicle.id}`} className="block text-xs font-medium mb-1">Model<span className="text-red-500">*</span></label><input id={`model-${vehicle.id}`} type="text" value={vehicle.model} onChange={(e) => { const updated = [...fleetData]; updated[index].model = e.target.value; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`year-${vehicle.id}`} className="block text-xs font-medium mb-1">Year<span className="text-red-500">*</span></label><input id={`year-${vehicle.id}`} type="number" value={vehicle.year} onChange={(e) => { const updated = [...fleetData]; updated[index].year = Number(e.target.value) || 0; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`capacity-${vehicle.id}`} className="block text-xs font-medium mb-1">Capacity (kg)</label><input id={`capacity-${vehicle.id}`} type="number" value={vehicle.capacity} onChange={(e) => { const updated = [...fleetData]; updated[index].capacity = Number(e.target.value) || 0; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`assetValue-${vehicle.id}`} className="block text-xs font-medium mb-1">Asset Value (R)<span className="text-red-500">*</span></label><input id={`assetValue-${vehicle.id}`} type="number" value={vehicle.assetValue} onChange={(e) => { const updated = [...fleetData]; updated[index].assetValue = Number(e.target.value) || 0; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`monthlyPayment-${vehicle.id}`} className="block text-xs font-medium mb-1">Monthly Payment (R)</label><input id={`monthlyPayment-${vehicle.id}`} type="number" value={vehicle.financing.monthlyPayment} onChange={(e) => { const updated = [...fleetData]; updated[index].financing.monthlyPayment = Number(e.target.value) || 0; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`insurance-${vehicle.id}`} className="block text-xs font-medium mb-1">Insurance (R/mo)</label><input id={`insurance-${vehicle.id}`} type="number" value={vehicle.insurance} onChange={(e) => { const updated = [...fleetData]; updated[index].insurance = Number(e.target.value) || 0; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`licensing-${vehicle.id}`} className="block text-xs font-medium mb-1">Licensing (R/yr)</label><input id={`licensing-${vehicle.id}`} type="number" value={vehicle.licensing} onChange={(e) => { const updated = [...fleetData]; updated[index].licensing = Number(e.target.value) || 0; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
                <div><label htmlFor={`tracking-${vehicle.id}`} className="block text-xs font-medium mb-1">Tracking (R/mo)</label><input id={`tracking-${vehicle.id}`} type="number" value={vehicle.tracking} onChange={(e) => { const updated = [...fleetData]; updated[index].tracking = Number(e.target.value) || 0; updateFirestoreData('fleet', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div>
              </div>
            </div>
          ))}
          {errors.global && <div className="text-red-500 text-center">{errors.global}</div>}
          <button onClick={() => {
            const lastVehicle = fleetData.length > 0 ? fleetData[fleetData.length - 1] : {};
            const validationErrors = validateFleetVehicle(lastVehicle);
            if (Object.keys(validationErrors).length > 0) {
              setErrors({ ...validationErrors, global: "Please fill in the required fields for the current vehicle before adding a new one." });
              return;
            }
            setErrors({});
            addFleetVehicle();
          }} className="w-full p-3 border-2 border-dashed rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2" style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}><Plus className="w-5 h-5" />Add Vehicle</button>
        </div>
        <div className="flex justify-end mt-6"><button onClick={() => setActiveModal(null)} className="px-4 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}><Save className="w-4 h-4 inline mr-2" />Save Fleet Data</button></div>
      </div>
    </div>
  );

  const RoutesModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-7xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Routes & Load Analysis</h3><button onClick={() => { setActiveModal(null); setErrors({}); }} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button></div>
        {errors.global && <div className="text-red-500 text-center mb-4">{errors.global}</div>}
        <div className="space-y-6">
          {routesData.map((routeData, index) => {
            const financials = routeFinancials[index] || {};
            return (
              <div key={routeData.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3"><h4 className="font-semibold">Route #{index + 1} - {routeData.routeName || 'New Route'}</h4><button onClick={() => removeRoute(routeData.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  <div className="bg-blue-50 p-3 rounded col-span-2"><h5 className="font-medium text-blue-800 mb-2">Budgeted Data</h5><div className="space-y-2"><label htmlFor={`routeName-${routeData.id}`} className="block text-xs font-medium mb-1">Route Name<span className="text-red-500">*</span></label><input id={`routeName-${routeData.id}`} type="text" value={routeData.routeName} onChange={(e) => { const updated = [...routesData]; updated[index].routeName = e.target.value; updateFirestoreData('routes', updated); }} placeholder="Route Name" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500" /><label htmlFor={`client-${routeData.id}`} className="block text-xs font-medium mb-1">Client<span className="text-red-500">*</span></label><input id={`client-${routeData.id}`} type="text" value={routeData.client} onChange={(e) => { const updated = [...routesData]; updated[index].client = e.target.value; updateFirestoreData('routes', updated); }} placeholder="Client Name" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500" /><label htmlFor={`distance-${routeData.id}`} className="block text-xs font-medium mb-1">Distance (km)<span className="text-red-500">*</span></label><input id={`distance-${routeData.id}`} type="number" value={routeData.distance} onChange={(e) => { const updated = [...routesData]; updated[index].distance = Number(e.target.value) || 0; updateFirestoreData('routes', updated); }} placeholder="e.g., 1400" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500" /><label htmlFor={`loadsPerMonth-${routeData.id}`} className="block text-xs font-medium mb-1">Loads per Month<span className="text-red-500">*</span></label><input id={`loadsPerMonth-${routeData.id}`} type="number" value={routeData.loadsPerMonth} onChange={(e) => { const updated = [...routesData]; updated[index].loadsPerMonth = Number(e.target.value) || 0; updateFirestoreData('routes', updated); }} placeholder="e.g., 8" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500" /><label htmlFor={`ratePerTon-${routeData.id}`} className="block text-xs font-medium mb-1">Rate per Ton (R)<span className="text-red-500">*</span></label><input id={`ratePerTon-${routeData.id}`} type="number" step="0.01" value={routeData.ratePerTon} onChange={(e) => { const updated = [...routesData]; updated[index].ratePerTon = parseFloat(e.target.value) || 0; updateFirestoreData('routes', updated); }} placeholder="e.g., 2.50" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500" /></div></div>
                  <div className="bg-purple-50 p-3 rounded col-span-2"><h5 className="font-medium text-purple-800 mb-2">Actual Data</h5><div className="space-y-2"><label htmlFor={`actualLoads-${routeData.id}`} className="block text-xs font-medium mb-1">Actual Loads per Month</label><input id={`actualLoads-${routeData.id}`} type="number" value={routeData.actuals?.loadsPerMonth} onChange={(e) => { const updated = [...routesData]; updated[index].actuals.loadsPerMonth = Number(e.target.value) || 0; updateFirestoreData('routes', updated); }} placeholder="e.g., 7" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-purple-500" /><label htmlFor={`actualRevenue-${routeData.id}`} className="block text-xs font-medium mb-1">Actual Revenue (R)</label><input id={`actualRevenue-${routeData.id}`} type="number" value={routeData.actuals?.revenue} onChange={(e) => { const updated = [...routesData]; updated[index].actuals.revenue = Number(e.target.value) || 0; updateFirestoreData('routes', updated); }} placeholder="e.g., 115000" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-purple-500" /></div></div>
                  <div className="bg-yellow-50 p-3 rounded"><h5 className="font-medium text-yellow-800 mb-2">Financial Summary</h5><div className="text-xs space-y-1"><div className="flex justify-between"><span>Revenue/Load:</span><span className="font-bold">R{financials.revenuePerLoad}</span></div><div className="flex justify-between"><span>Cost/Load:</span><span>R{financials.totalCostPerLoad}</span></div><div className="flex justify-between"><span>Profit/Load:</span><span className={`font-bold ${parseFloat(financials.profitPerLoad) >= 0 ? 'text-green-600' : 'text-red-600'}`}>R{financials.profitPerLoad}</span></div><div className="flex justify-between"><span>Margin:</span><span className="font-bold">{financials.profitMargin}%</span></div><div className="flex justify-between"><span>Monthly Revenue:</span><span className="font-bold">R{parseFloat(financials.revenuePerMonth).toLocaleString()}</span></div><div className="flex justify-between"><span>Break-even:</span><span className="font-bold">{financials.breakEvenLoads} loads</span></div></div></div>
                </div>
              </div>
            );
          })}
          <button onClick={addRoute} className="w-full p-3 border-2 border-dashed rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2" style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}><Plus className="w-5 h-5" />Add Route</button>
        </div>
        <div className="flex justify-end mt-6"><button onClick={() => setActiveModal(null)} className="px-4 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}><Save className="w-4 h-4 inline mr-2" />Save Routes Data</button></div>
      </div>
    </div>
  );

  const FixedCostsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Fixed Costs Management</h3><button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg"><div className="flex justify-between items-center mb-3"><h4 className="font-semibold text-blue-800">Capital Recovery</h4><button onClick={() => addFixedCostItem('capitalRecovery')} className="text-blue-600 hover:text-blue-800" style={{ color: PRIMARY_COLOR }}><Plus className="w-4 h-4" /></button></div><div className="space-y-2">{fixedCosts.capitalRecovery?.map((item, index) => (<div key={index} className="bg-white p-2 rounded"><input type="text" value={item.name} onChange={(e) => { const updated = { ...fixedCosts }; updated.capitalRecovery[index].name = e.target.value; updateFirestoreData('fixedCosts', updated); }} placeholder="Item name" className="w-full p-1 border rounded text-xs mb-1 focus:ring-1 focus:ring-blue-500" /><input type="number" value={item.amount} onChange={(e) => { const updated = { ...fixedCosts }; updated.capitalRecovery[index].amount = Number(e.target.value) || 0; updateFirestoreData('fixedCosts', updated); }} placeholder="Amount" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500" /></div>))}</div></div>
          <div className="bg-purple-50 p-4 rounded-lg"><div className="flex justify-between items-center mb-3"><h4 className="font-semibold text-purple-800">Personnel</h4><button onClick={() => addFixedCostItem('personnel')} className="text-purple-600 hover:text-purple-800" style={{ color: PRIMARY_COLOR }}><Plus className="w-4 h-4" /></button></div><div className="space-y-2">{fixedCosts.personnel?.map((item, index) => (<div key={index} className="bg-white p-2 rounded"><input type="text" value={item.name} onChange={(e) => { const updated = { ...fixedCosts }; updated.personnel[index].name = e.target.value; updateFirestoreData('fixedCosts', updated); }} placeholder="Position" className="w-full p-1 border rounded text-xs mb-1 focus:ring-1 focus:ring-purple-500" /><div className="grid grid-cols-2 gap-1"><input type="number" step="0.5" value={item.count} onChange={(e) => { const updated = { ...fixedCosts }; updated.personnel[index].count = Number(e.target.value) || 0; updated.personnel[index].total = updated.personnel[index].count * updated.personnel[index].salary; updateFirestoreData('fixedCosts', updated); }} placeholder="Count" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-purple-500" /><input type="number" value={item.salary} onChange={(e) => { const updated = { ...fixedCosts }; updated.personnel[index].salary = Number(e.target.value) || 0; updated.personnel[index].total = updated.personnel[index].count * updated.personnel[index].salary; updateFirestoreData('fixedCosts', updated); }} placeholder="Salary" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-purple-500" /></div><div className="text-xs text-gray-600 mt-1">Total: R{Number(item.total).toLocaleString()}</div></div>))}</div></div>
          <div className="bg-green-50 p-4 rounded-lg"><div className="flex justify-between items-center mb-3"><h4 className="font-semibold text-green-800">Operations</h4><button onClick={() => addFixedCostItem('operations')} className="text-green-600 hover:text-green-800" style={{ color: PRIMARY_COLOR }}><Plus className="w-4 h-4" /></button></div><div className="space-y-2">{fixedCosts.operations?.map((item, index) => (<div key={index} className="bg-white p-2 rounded"><input type="text" value={item.name} onChange={(e) => { const updated = { ...fixedCosts }; updated.operations[index].name = e.target.value; updateFirestoreData('fixedCosts', updated); }} placeholder="Item name" className="w-full p-1 border rounded text-xs mb-1 focus:ring-1 focus:ring-green-500" /><input type="number" value={item.amount} onChange={(e) => { const updated = { ...fixedCosts }; updated.operations[index].amount = Number(e.target.value) || 0; updateFirestoreData('fixedCosts', updated); }} placeholder="Amount" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-green-500" /><select value={item.frequency} onChange={(e) => { const updated = { ...fixedCosts }; updated.operations[index].frequency = e.target.value; updateFirestoreData('fixedCosts', updated); }} className="w-full p-1 border rounded text-xs mt-1 focus:ring-1 focus:ring-green-500"><option value="monthly">Monthly</option><option value="annual">Annual</option></select></div>))}</div></div>
          <div className="bg-yellow-50 p-4 rounded-lg"><div className="flex justify-between items-center mb-3"><h4 className="font-semibold text-yellow-800">Overheads</h4><button onClick={() => addFixedCostItem('overheads')} className="text-yellow-600 hover:text-yellow-800" style={{ color: PRIMARY_COLOR }}><Plus className="w-4 h-4" /></button></div><div className="space-y-2">{fixedCosts.overheads?.map((item, index) => (<div key={index} className="bg-white p-2 rounded"><input type="text" value={item.name} onChange={(e) => { const updated = { ...fixedCosts }; updated.overheads[index].name = e.target.value; updateFirestoreData('fixedCosts', updated); }} placeholder="Item name" className="w-full p-1 border rounded text-xs mb-1 focus:ring-1 focus:ring-yellow-500" /><input type="number" value={item.amount} onChange={(e) => { const updated = { ...fixedCosts }; updated.overheads[index].amount = Number(e.target.value) || 0; updateFirestoreData('fixedCosts', updated); }} placeholder="Amount" className="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-yellow-500" /></div>))}</div></div>
        </div>
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: ACCENT_COLOR, color: PRIMARY_COLOR }}><div className="text-lg font-bold text-center">Total Annual Fixed Costs: R{totalAnnualFixedCosts.toLocaleString()}</div><div className="text-sm text-center">Monthly: R{Math.round(totalAnnualFixedCosts / 12).toLocaleString()}</div></div>
        <div className="flex justify-end mt-6"><button onClick={() => setActiveModal(null)} className="px-4 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}><Save className="w-4 h-4 inline mr-2" />Save Fixed Costs</button></div>
      </div>
    </div>
  );
  const VariableCostsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Variable Costs Management</h3><button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg"><h4 className="font-semibold text-blue-800 mb-2">Fuel Costs</h4><div className="space-y-2"><div><label htmlFor="fuelPrice" className="block text-xs font-medium mb-1">Price per Liter (R)</label><input id="fuelPrice" type="number" step="0.01" value={variableCosts.fuel?.pricePerLiter || ''} onChange={(e) => { const updated = { ...variableCosts, fuel: { ...variableCosts.fuel, pricePerLiter: Number(e.target.value) || 0 } }; updateFirestoreData('variableCosts', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div><div><label htmlFor="fuelConsumption" className="block text-xs font-medium mb-1">Consumption per 100km (L)</label><input id="fuelConsumption" type="number" step="0.1" value={variableCosts.fuel?.consumptionPer100km || ''} onChange={(e) => { const updated = { ...variableCosts, fuel: { ...variableCosts.fuel, consumptionPer100km: Number(e.target.value) || 0 } }; updateFirestoreData('variableCosts', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500" /></div></div></div>
          <div className="bg-green-50 p-4 rounded-lg"><h4 className="font-semibold text-green-800 mb-2">Maintenance Costs</h4><div className="space-y-2"><div><label htmlFor="maintenanceCost" className="block text-xs font-medium mb-1">Maintenance Cost per km (R)</label><input id="maintenanceCost" type="number" step="0.01" value={variableCosts.maintenance?.costPerKm || ''} onChange={(e) => { const updated = { ...variableCosts, maintenance: { ...variableCosts.maintenance, costPerKm: Number(e.target.value) || 0 } }; updateFirestoreData('variableCosts', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-green-500" /></div><div><label htmlFor="tyreCost" className="block text-xs font-medium mb-1">Tyre Cost per km (R)</label><input id="tyreCost" type="number" step="0.01" value={variableCosts.tyres?.costPerKm || ''} onChange={(e) => { const updated = { ...variableCosts, tyres: { ...variableCosts.tyres, costPerKm: Number(e.target.value) || 0 } }; updateFirestoreData('variableCosts', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-green-500" /></div></div></div>
          <div className="bg-yellow-50 p-4 rounded-lg"><h4 className="font-semibold text-yellow-800 mb-2">Trip Overheads</h4><div className="space-y-2"><div><label htmlFor="tolls" className="block text-xs font-medium mb-1">Average Tolls per km (R)</label><input id="tolls" type="number" step="0.01" value={variableCosts.tolls?.averagePerKm || ''} onChange={(e) => { const updated = { ...variableCosts, tolls: { ...variableCosts.tolls, averagePerKm: Number(e.target.value) || 0 } }; updateFirestoreData('variableCosts', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-yellow-500" /></div><div><label htmlFor="parkingCost" className="block text-xs font-medium mb-1">Parking Cost per Night (R)</label><input id="parkingCost" type="number" value={variableCosts.parking?.costPerNight || ''} onChange={(e) => { const updated = { ...variableCosts, parking: { ...variableCosts.parking, costPerNight: Number(e.target.value) || 0 } }; updateFirestoreData('variableCosts', updated); }} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-yellow-500" /></div></div></div>
        </div>
        <div className="flex justify-end mt-6"><button onClick={() => setActiveModal(null)} className="px-4 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}><Save className="w-4 h-4 inline mr-2" />Save Variable Costs</button></div>
      </div>
    </div>
  );
  
  const ProfileModal = () => {
    const [tempProfile, setTempProfile] = useState(profileData);
    const handleSaveProfile = async () => {
      await updateFirestoreData('profile', tempProfile);
      setActiveModal(null);
    };
  
    const exportData = (dataType) => {
      let dataToExport = [];
      let filename = 'data.csv';
  
      switch (dataType) {
        case 'fleet':
          dataToExport = fleetData;
          filename = 'haulytics_fleet_data.csv';
          break;
        case 'routes':
          dataToExport = routesData;
          filename = 'haulytics_routes_data.csv';
          break;
        case 'fixedCosts':
          dataToExport = fixedCosts;
          filename = 'haulytics_fixed_costs.csv';
          break;
        default:
          return;
      }
      exportToCSV(dataToExport, filename);
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[90vh] overflow-y-auto w-full">
          <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Profile & Settings</h3><button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button></div>
          <div className="space-y-6">
            <div className="p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-lg mb-2">Business Information</h4>
              <div className="space-y-4">
                <div><label htmlFor="businessName" className="block text-sm font-medium mb-1">Business Name</label><input id="businessName" type="text" value={tempProfile.businessName} onChange={(e) => setTempProfile({ ...tempProfile, businessName: e.target.value })} className="w-full p-2 border rounded" style={{ borderColor: PRIMARY_COLOR }} /></div>
                <div><label htmlFor="contactPerson" className="block text-sm font-medium mb-1">Contact Person</label><input id="contactPerson" type="text" value={tempProfile.contactPerson} onChange={(e) => setTempProfile({ ...tempProfile, contactPerson: e.target.value })} className="w-full p-2 border rounded" style={{ borderColor: PRIMARY_COLOR }} /></div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-lg mb-2">Data Management</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => exportData('fleet')} className="w-full p-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR, color: ACCENT_COLOR }}><FileText className="w-5 h-5" />Export Fleet CSV</button>
                <button onClick={() => exportData('routes')} className="w-full p-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR, color: ACCENT_COLOR }}><FileText className="w-5 h-5" />Export Routes CSV</button>
                <button onClick={() => exportData('fixedCosts')} className="w-full p-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR, color: ACCENT_COLOR }}><FileText className="w-5 h-5" />Export Costs CSV</button>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6"><button onClick={handleSaveProfile} className="px-4 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}><Save className="w-4 h-4 inline mr-2" />Save Profile</button></div>
        </div>
      </div>
    );
  };

  const KmToDateModal = () => {
    const [kmValue, setKmValue] = useState('');
    const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 10));
    const [selectedRouteId, setSelectedRouteId] = useState(routesData.length > 0 ? routesData[0].id : '');
    const selectedRoute = routesData.find(r => r.id === selectedRouteId);
    
    const handleAddKmEntry = async () => {
      if (!selectedRouteId || !kmValue || !dateValue) {
        setErrors({ global: 'Please select a route and provide a valid date and kilometer value.' });
        return;
      }
      setErrors({});
      const updatedRoutes = routesData.map(route => {
        if (route.id === selectedRouteId) {
          const newKmLog = [...(route.kmLog || []), { date: dateValue, actualKm: Number(kmValue) }];
          return { ...route, kmLog: newKmLog };
        }
        return route;
      });
      await updateFirestoreData('routes', updatedRoutes);
      setKmValue('');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto w-full">
          <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold">Kilometers to Date</h3><button onClick={() => setActiveModal(null)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button></div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-gray-200" style={{borderColor: PRIMARY_COLOR}}>
              <h4 className="font-semibold text-lg mb-2">Log New Kilometers</h4>
              {errors.global && <div className="text-red-500 text-center mb-2">{errors.global}</div>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="kmRouteSelect" className="block text-sm font-medium mb-1">Select Route</label>
                  <select id="kmRouteSelect" value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)} className="w-full p-2 border rounded" style={{ borderColor: PRIMARY_COLOR }}>
                    {routesData.map(route => (<option key={route.id} value={route.id}>{route.routeName}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="kmDateInput" className="block text-sm font-medium mb-1">Date</label>
                  <input id="kmDateInput" type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)} className="w-full p-2 border rounded" style={{ borderColor: PRIMARY_COLOR }}/>
                </div>
                <div>
                  <label htmlFor="kmValueInput" className="block text-sm font-medium mb-1">Kilometers Driven</label>
                  <input id="kmValueInput" type="number" value={kmValue} onChange={(e) => setKmValue(e.target.value)} placeholder="e.g., 500" className="w-full p-2 border rounded" style={{ borderColor: PRIMARY_COLOR }}/>
                </div>
              </div>
              <button onClick={handleAddKmEntry} className="mt-4 w-full p-3 rounded-lg text-white font-medium hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}>Add Entry</button>
            </div>
            
            <div className="p-4 rounded-lg border border-gray-200" style={{borderColor: PRIMARY_COLOR}}>
              <h4 className="font-semibold text-lg mb-2">Historical Kilometers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routesData.map(route => {
                  const budgetedKmPerMonth = (Number(route.distance) || 0) * (Number(route.loadsPerMonth) || 0) * 2;
                  const currentMonthActualKm = route.kmLog?.filter(log => new Date(log.date).getMonth() === new Date().getMonth()).reduce((sum, log) => sum + (log.actualKm || 0), 0) || 0;
                  const variance = currentMonthActualKm - budgetedKmPerMonth;
                  const isPositiveVariance = variance >= 0;
                  
                  return (
                    <div key={route.id} className="p-4 rounded-lg shadow-inner bg-gray-100 text-center space-y-2">
                      <h5 className="font-medium text-lg" style={{ color: PRIMARY_COLOR }}>{route.routeName}</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: ACCENT_COLOR, color: PRIMARY_COLOR }}><span className="block font-medium">Budgeted KM</span><span className="font-bold">{budgetedKmPerMonth.toLocaleString()}</span></div>
                        <div className="p-2 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR, color: ACCENT_COLOR }}><span className="block font-medium">Actual KM</span><span className="font-bold">{currentMonthActualKm.toLocaleString()}</span></div>
                      </div>
                      <div className={`p-2 rounded-lg flex flex-col justify-center items-center ${isPositiveVariance ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        <span className="block text-xs font-medium">Variance</span>
                        <span className="font-bold">{Math.abs(variance).toLocaleString()}</span>
                        <span className="text-xs">{isPositiveVariance ? 'On Target' : 'Off Target'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center">
        <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
        <p className="mb-6">Are you sure you want to delete this item? This action cannot be undone.</p>
        <div className="flex justify-center gap-4">
          <button onClick={handleCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Cancel</button>
          <button onClick={handleAction} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600">Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">Haulytics</h1>
            <img src="http://googleusercontent.com/file_content/1" alt="Haulytics Logo" className="h-10" />
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">{profileData.businessName}</h2>
            <div className="text-sm text-gray-500">Authenticated as **{profileData.contactPerson}**</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveModal('fleet')}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><Truck className="w-5 h-5" style={{ color: PRIMARY_COLOR }} /><span className="font-medium">Fleet Management</span></div><Edit3 className="w-4 h-4 text-gray-400" /></div><div className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>{fleetData.length}</div><div className="text-sm text-gray-500">Vehicles</div></div>
          <div className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveModal('routes')}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><MapPin className="w-5 h-5" style={{ color: PRIMARY_COLOR }} /><span className="font-medium">Routes & Loads</span></div><Edit3 className="w-4 h-4 text-gray-400" /></div><div className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>{routesData.length}</div><div className="text-sm text-gray-500">Active Routes</div></div>
          <div className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveModal('fixedCosts')}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><PiggyBank className="w-5 h-5" style={{ color: PRIMARY_COLOR }} /><span className="font-medium">Fixed Costs</span></div><Edit3 className="w-4 h-4 text-gray-400" /></div><div className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>R{Math.round(totalAnnualFixedCosts / 1000000)}M</div><div className="text-sm text-gray-500">Annual</div></div>
          <div className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveModal('variableCosts')}><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><DollarSign className="w-5 h-5" style={{ color: PRIMARY_COLOR }} /><span className="font-medium">Variable Costs</span></div><Edit3 className="w-4 h-4 text-gray-400" /></div><div className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>R{(variableCosts.fuel?.pricePerLiter || 0).toFixed(2)}</div><div className="text-sm text-gray-500">Fuel/Litre</div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: PRIMARY_COLOR }}><Calculator className="w-5 h-5" />Route Profitability Calculator</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div><label htmlFor="routeSelect" className="block text-sm font-medium text-gray-700 mb-2">Select Route</label><select id="routeSelect" value={route.selectedRouteId} onChange={(e) => { const selectedRoute = routesData.find(r => r.id.toString() === e.target.value); if (selectedRoute) { setRoute({...route, selectedRouteId: e.target.value, distance: selectedRoute.returnDistance.toString(), tollCosts: selectedRoute.tollCosts.toString()}); } else { setRoute({...route, selectedRouteId: e.target.value}); } }} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><option value="">Select existing route or enter manually</option>{routesData.map(routeData => (<option key={routeData.id} value={routeData.id}>{routeData.routeName} - {routeData.client}</option>))}</select></div>
              <div><label htmlFor="distanceInput" className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label><input id="distanceInput" type="number" value={route.distance} onChange={(e) => setRoute({...route, distance: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 500" /></div>
              <div><label htmlFor="loadRateInput" className="block text-sm font-medium text-gray-700 mb-2">Load Rate (R)</label><input id="loadRateInput" type="number" value={route.loadRate} onChange={(e) => setRoute({...route, loadRate: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 15000" /></div>
              <div><label htmlFor="tollCostsInput" className="block text-sm font-medium text-gray-700 mb-2">Toll Costs (R)</label><input id="tollCostsInput" type="number" value={route.tollCosts} onChange={(e) => setRoute({...route, tollCosts: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 500" /></div>
            </div>
            {routeResults.revenue && (
              <div className="rounded-lg p-4" style={{ backgroundColor: ACCENT_COLOR, color: PRIMARY_COLOR }}>
                <h3 className="font-semibold mb-3">Route Analysis Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center"><div className="text-sm text-gray-600">Variable Costs</div><div className="text-lg font-bold">R{routeResults.totalVariableCosts}</div></div>
                  <div className="text-center"><div className="text-sm text-gray-600">Revenue</div><div className="text-lg font-bold text-green-600">R{routeResults.revenue}</div></div>
                  <div className="text-center"><div className="text-sm text-gray-600">Profit</div><div className={`text-lg font-bold ${parseFloat(routeResults.profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>R{routeResults.profit}</div></div>
                  <div className="text-center"><div className="text-sm text-gray-600">Margin</div><div className="text-lg font-bold">{routeResults.profitMargin}%</div></div>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getProfitabilityColor(profitability)}`}>{getProfitabilityIcon(profitability)}{profitability && `${profitability.charAt(0).toUpperCase() + profitability.slice(1)} (${routeResults.profitMargin}% margin)`}</div>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6"><h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: PRIMARY_COLOR }}><Truck className="w-5 h-5" />Fleet Overview</h3><div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Total Vehicles</span><span className="font-medium">{fleetData.length}</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Total Capacity</span><span className="font-medium">{fleetData.reduce((sum, v) => sum + Number(v.capacity), 0).toLocaleString()} kg</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Fleet Value</span><span className="font-medium">R{fleetData.reduce((sum, v) => sum + Number(v.assetValue), 0).toLocaleString()}</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Monthly Payments</span><span className="font-medium">R{fleetData.reduce((sum, v) => sum + Number(v.financing?.monthlyPayment), 0).toLocaleString()}</span></div></div></div>
            <div className="bg-white rounded-lg shadow-md p-6"><h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: PRIMARY_COLOR }}><MapPin className="w-5 h-5" />Routes Summary</h3><div className="space-y-2">{routesData.slice(0, 3).map((routeData, index) => { const financials = routeFinancials[index] || {}; return (<div key={routeData.id} className="p-2 bg-gray-50 rounded"><div className="text-sm font-medium">{routeData.routeName}</div><div className="text-xs text-gray-600">{routeData.client}</div><div className="flex justify-between text-xs"><span>Revenue: R{parseFloat(financials.revenuePerMonth).toLocaleString()}/mo</span><span className={parseFloat(financials.profitMargin) >= 10 ? 'text-green-600' : 'text-red-600'}>{financials.profitMargin}% margin</span></div></div>); })} {routesData.length > 3 && (<div className="text-center text-sm text-gray-500 pt-2">+{routesData.length - 3} more routes</div>)}</div></div>
            <div className="bg-white rounded-lg shadow-md p-6"><h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: PRIMARY_COLOR }}><TrendingUp className="w-5 h-5" />Performance Analysis</h3><div className="space-y-4">
              {routesData.map((routeData, index) => {
                const budgetedRevenue = parseFloat(routeFinancials[index]?.revenuePerMonth) || 0;
                const actualRevenue = parseFloat(routeData.actuals?.revenue) || 0;
                const variance = actualRevenue - budgetedRevenue;
                const isPositiveVariance = variance >= 0;
                
                const budgetedCost = parseFloat(routeFinancials[index]?.totalCostPerLoad) * (parseFloat(routeData.loadsPerMonth) || 0);
                const actualCost = parseFloat(routeData.actuals?.fuelCost) + parseFloat(routeData.actuals?.otherCosts);
                const costVariance = budgetedCost - actualCost; // Budgeted minus Actual
                const isCostPositiveVariance = costVariance >= 0;

                const budgetedProfit = budgetedRevenue - budgetedCost;
                const actualProfit = actualRevenue - actualCost;
                const profitVariance = actualProfit - budgetedProfit;
                const isProfitPositiveVariance = profitVariance >= 0;

                return (
                  <div key={routeData.id} className="bg-gray-100 p-4 rounded-lg shadow-inner">
                    <h4 className="font-semibold text-lg mb-2" style={{ color: PRIMARY_COLOR }}>{routeData.routeName}</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: ACCENT_COLOR, color: PRIMARY_COLOR }}><span className="block text-xs font-medium">Budgeted Rev</span><span className="font-bold">R{budgetedRevenue.toLocaleString()}</span></div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR, color: ACCENT_COLOR }}><span className="block text-xs font-medium">Actual Rev</span><span className="font-bold">R{actualRevenue.toLocaleString()}</span></div>
                      <div className={`p-2 rounded-lg flex flex-col justify-center items-center ${isPositiveVariance ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}><span className="block text-xs font-medium">Revenue Variance</span><span className="font-bold">R{Math.abs(variance).toLocaleString()}</span><span className="text-xs">{isPositiveVariance ? 'On Track' : 'Off Target'}</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-2">
                       <div className="p-2 rounded-lg" style={{ backgroundColor: ACCENT_COLOR, color: PRIMARY_COLOR }}><span className="block text-xs font-medium">Budgeted Costs</span><span className="font-bold">R{budgetedCost.toLocaleString()}</span></div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR, color: ACCENT_COLOR }}><span className="block text-xs font-medium">Actual Costs</span><span className="font-bold">R{actualCost.toLocaleString()}</span></div>
                      <div className={`p-2 rounded-lg flex flex-col justify-center items-center ${isCostPositiveVariance ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}><span className="block text-xs font-medium">Cost Variance</span><span className="font-bold">R{Math.abs(costVariance).toLocaleString()}</span><span className="text-xs">{isCostPositiveVariance ? 'On Track' : 'Off Target'}</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mt-2">
                       <div className="p-2 rounded-lg" style={{ backgroundColor: ACCENT_COLOR, color: PRIMARY_COLOR }}><span className="block text-xs font-medium">Budgeted Profit</span><span className="font-bold">R{budgetedProfit.toLocaleString()}</span></div>
                      <div className="p-2 rounded-lg" style={{ backgroundColor: PRIMARY_COLOR, color: ACCENT_COLOR }}><span className="block text-xs font-medium">Actual Profit</span><span className="font-bold">R{actualProfit.toLocaleString()}</span></div>
                      <div className={`p-2 rounded-lg flex flex-col justify-center items-center ${isProfitPositiveVariance ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}><span className="block text-xs font-medium">Profit Variance</span><span className="font-bold">R{Math.abs(profitVariance).toLocaleString()}</span><span className="text-xs">{isProfitPositiveVariance ? 'On Track' : 'Off Target'}</span></div>
                    </div>
                  </div>
                );
              })}
            </div></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveModal('kmToDate')}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                <span className="font-medium">Kilometers to Date</span>
              </div>
              <Edit3 className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold" style={{ color: PRIMARY_COLOR }}>
              {(routesData.reduce((sum, r) => sum + r.kmLog.reduce((logSum, log) => logSum + (log.actualKm || 0), 0), 0)).toLocaleString()} km
            </div>
            <div className="text-sm text-gray-500">All Routes</div>
          </div>
        </div>
        {activeModal === 'fleet' && <FleetModal />}
        {activeModal === 'routes' && <RoutesModal />}
        {activeModal === 'fixedCosts' && <FixedCostsModal />}
        {activeModal === 'variableCosts' && <VariableCostsModal />}
        {activeModal === 'profile' && <ProfileModal />}
        {activeModal === 'kmToDate' && <KmToDateModal />}
        {showConfirm && <ConfirmationModal />}
        <div className="mt-8 text-center text-sm text-gray-500"><p>Advanced Trucking Business Dashboard - Complete Fleet & Route Management System</p></div>
      </div>
    </div>
  );
}
