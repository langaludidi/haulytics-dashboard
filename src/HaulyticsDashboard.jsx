import React, { useState, useEffect } from 'react';
import { BarChart3, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { db, auth } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HaulyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [fleetData, setFleetData] = useState([]);
  const [routesData, setRoutesData] = useState([]);
  const [costsData, setCostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth)
          .then(() => toast.success('Signed in anonymously'))
          .catch((error) => toast.error(`Auth error: ${error.message}`));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const fleetSnapshot = await getDocs(
          collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/fleet`)
        );
        const fleet = fleetSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFleetData(fleet);

        const routesSnapshot = await getDocs(
          collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/routes`)
        );
        const routes = routesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRoutesData(routes);

        const costsSnapshot = await getDocs(
          collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/costs`)
        );
        const costs = costsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCostsData(costs);

        setLoading(false);
      } catch (error) {
        toast.error(`Error fetching data: ${error.message}`);
        setLoading(false);
      }
    };

    if (auth.currentUser) fetchData();
  }, []);

  const validateFleetVehicle = (data) => {
    if (!data.vehicleName || !data.status) return 'Vehicle name and status are required';
    return null;
  };

  const validateRoute = (data) => {
    if (!data.routeName || !data.tonnage || !data.ratePerTon || !data.loadsPerMonth || !data.returnDistance)
      return 'All route fields are required';
    if (data.tonnage <= 0 || data.ratePerTon <= 0 || data.loadsPerMonth <= 0 || data.returnDistance <= 0)
      return 'Numeric fields must be positive';
    return null;
  };

  const validateCosts = (data) => {
    if (!data.date || !data.amount) return 'Date and amount are required';
    if (data.amount <= 0) return 'Amount must be positive';
    return null;
  };

  const handleAdd = async (type, data) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      let validationError;
      if (type === 'fleet') validationError = validateFleetVehicle(data);
      else if (type === 'routes') validationError = validateRoute(data);
      else if (type === 'costs') validationError = validateCosts(data);

      if (validationError) {
        toast.error(validationError);
        return;
      }

      const collectionRef = collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`);
      await addDoc(collectionRef, data);
      toast.success(`${type} added successfully`);
      setModalOpen(null);
      setFormData({});
      const snapshot = await getDocs(collectionRef);
      if (type === 'fleet') setFleetData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'routes') setRoutesData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'costs') setCostsData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error(`Error adding ${type}: ${error.message}`);
    }
  };

  const handleEdit = async (type, id, data) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      let validationError;
      if (type === 'fleet') validationError = validateFleetVehicle(data);
      else if (type === 'routes') validationError = validateRoute(data);
      else if (type === 'costs') validationError = validateCosts(data);

      if (validationError) {
        toast.error(validationError);
        return;
      }

      const docRef = doc(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`, id);
      await updateDoc(docRef, data);
      toast.success(`${type} updated successfully`);
      setModalOpen(null);
      setFormData({});
      const collectionRef = collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`);
      const snapshot = await getDocs(collectionRef);
      if (type === 'fleet') setFleetData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'routes') setRoutesData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'costs') setCostsData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error(`Error updating ${type}: ${error.message}`);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const docRef = doc(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`, id);
      await deleteDoc(docRef);
      toast.success(`${type} deleted successfully`);
      const collectionRef = collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`);
      const snapshot = await getDocs(collectionRef);
      if (type === 'fleet') setFleetData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'routes') setRoutesData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'costs') setCostsData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error(`Error deleting ${type}: ${error.message}`);
    }
  };

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).filter((key) => key !== 'id');
    const csvRows = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(',')),
    ];
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${filename} to CSV`);
  };

  const chartData = {
    labels: costsData.map((item) => item.date || 'Unknown'),
    datasets: [
      {
        label: 'Costs ($)',
        data: costsData.map((item) => item.amount || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Monthly Costs' },
    },
  };

  const annualSummary = routesData.reduce(
    (acc, route) => {
      const loadsPerYear = (route.loadsPerMonth || 0) * 12;
      const revenue = loadsPerYear * (route.ratePerTon || 0) * (route.tonnage || 0);
      const distance = loadsPerYear * (route.returnDistance || 0);
      const totalCosts = costsData.reduce((sum, cost) => sum + (cost.amount || 0), 0);
      const profit = revenue - totalCosts;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const breakEvenLoads = totalCosts / ((route.ratePerTon || 0) * (route.tonnage || 0));

      return {
        totalLoads: acc.totalLoads + loadsPerYear,
        totalDistance: acc.totalDistance + distance,
        totalRevenue: acc.totalRevenue + revenue,
        totalCosts: acc.totalCosts + totalCosts,
        totalProfit: acc.totalProfit + profit,
        averageMargin: acc.totalRevenue > 0 ? (acc.totalProfit / acc.totalRevenue) * 100 : 0,
        breakEvenLoads: acc.breakEvenLoads + breakEvenLoads,
      };
    },
    {
      totalLoads: 0,
      totalDistance: 0,
      totalRevenue: 0,
      totalCosts: 0,
      totalProfit: 0,
      averageMargin: 0,
      breakEvenLoads: 0,
    }
  );

  const getProfitabilityIndicator = (margin) => {
    if (margin >= 30) return { text: 'Excellent', color: 'text-green-500' };
    if (margin >= 15) return { text: 'Good', color: 'text-blue-500' };
    if (margin >= 5) return { text: 'Marginal', color: 'text-yellow-500' };
    return { text: 'Poor', color: 'text-red-500' };
  };

  const Modal = ({ type, data = {}, onSave, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center" role="dialog" aria-labelledby={`${type}-modal-title`}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 id={`${type}-modal-title`} className="text-xl font-semibold mb-4">
          {data.id ? `Edit ${type}` : `Add ${type}`}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(type, data.id || null, formData);
          }}
        >
          {type === 'fleet' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="vehicleName">Vehicle Name</label>
                <input
                  id="vehicleName"
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.vehicleName || ''}
                  onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="status">Status</label>
                <input
                  id="status"
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.status || ''}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  aria-required="true"
                />
              </div>
            </>
          )}
          {type === 'routes' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="routeName">Route Name</label>
                <input
                  id="routeName"
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.routeName || ''}
                  onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="tonnage">Tonnage</label>
                <input
                  id="tonnage"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.tonnage || ''}
                  onChange={(e) => setFormData({ ...formData, tonnage: parseFloat(e.target.value) })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="ratePerTon">Rate per Ton ($)</label>
                <input
                  id="ratePerTon"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.ratePerTon || ''}
                  onChange={(e) => setFormData({ ...formData, ratePerTon: parseFloat(e.target.value) })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="loadsPerMonth">Loads per Month</label>
                <input
                  id="loadsPerMonth"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.loadsPerMonth || ''}
                  onChange={(e) => setFormData({ ...formData, loadsPerMonth: parseInt(e.target.value) })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="returnDistance">Return Distance (km)</label>
                <input
                  id="returnDistance"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.returnDistance || ''}
                  onChange={(e) => setFormData({ ...formData, returnDistance: parseFloat(e.target.value) })}
                  aria-required="true"
                />
              </div>
            </>
          )}
          {type === 'costs' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  className="w-full p-2 border rounded"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="amount">Amount ($)</label>
                <input
                  id="amount"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  aria-required="true"
                />
              </div>
            </>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={onClose}
              aria-label={`Close ${type} modal`}
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" aria-label={`Save ${type}`}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      <header className="bg-white shadow p-4 flex items-center">
        <img src="/src/assets/logo.png" alt="Haulytics Logo" className="h-10 mr-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Haulytics Dashboard</h1>
      </header>

      <div className="p-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div
                className="bg-white p-4 rounded shadow cursor-pointer"
                onClick={() => setActiveTab('fleet')}
                role="button"
                aria-label="Fleet Overview"
              >
                <h3 className="text-lg font-semibold">Fleet Size</h3>
                <p>{fleetData.length} vehicles</p>
              </div>
              <div
                className="bg-white p-4 rounded shadow cursor-pointer"
                onClick={() => setActiveTab('routes')}
                role="button"
                aria-label="Active Routes"
              >
                <h3 className="text-lg font-semibold">Active Routes</h3>
                <p>{routesData.length} routes</p>
              </div>
              <div
                className="bg-white p-4 rounded shadow cursor-pointer"
                onClick={() => setActiveTab('costs')}
                role="button"
                aria-label="Total Costs"
              >
                <h3 className="text-lg font-semibold">Total Costs</h3>
                <p>${annualSummary.totalCosts.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex border-b mx-4">
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'overview' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('overview')}
                aria-selected={activeTab === 'overview'}
                role="tab"
              >
                <TrendingUp className="mr-2" /> Overview
              </button>
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'fleet' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('fleet')}
                aria-selected={activeTab === 'fleet'}
                role="tab"
              >
                <BarChart3 className="mr-2" /> Fleet
              </button>
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'routes' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('routes')}
                aria-selected={activeTab === 'routes'}
                role="tab"
              >
                <MapPin className="mr-2" /> Routes
              </button>
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'costs' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('costs')}
                aria-selected={activeTab === 'costs'}
                role="tab"
              >
                <DollarSign className="mr-2" /> Costs
              </button>
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'profitability' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('profitability')}
                aria-selected={activeTab === 'profitability'}
                role="tab"
              >
                <TrendingUp className="mr-2" /> Profitability
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
                  <p>Welcome to the Haulytics Dashboard, your tool for managing trucking operations.</p>
                </div>
              )}
              {activeTab === 'fleet' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Fleet Overview</h2>
                  <button
                    className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                      setFormData({});
                      setModalOpen('fleet');
                    }}
                    aria-label="Add new vehicle"
                  >
                    Add Vehicle
                  </button>
                  <button
                    className="mb-4 ml-2 px-4 py-2 bg-green-500 text-white rounded"
                    onClick={() => exportToCSV(fleetData, 'fleet')}
                    aria-label="Export fleet to CSV"
                  >
                    Export to CSV
                  </button>
                  <ul>
                    {fleetData.length ? (
                      fleetData.map((item) => (
                        <li key={item.id} className="p-2 border-b flex justify-between">
                          <span>
                            Vehicle: {item.vehicleName || 'N/A'} - Status: {item.status || 'N/A'}
                          </span>
                          <div>
                            <button
                              className="text-blue-500 mr-2"
                              onClick={() => {
                                setFormData(item);
                                setModalOpen('fleet');
                              }}
                              aria-label={`Edit vehicle ${item.vehicleName}`}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500"
                              onClick={() => handleDelete('fleet', item.id)}
                              aria-label={`Delete vehicle ${item.vehicleName}`}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p>No fleet data available.</p>
                    )}
                  </ul>
                </div>
              )}
              {activeTab === 'routes' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Routes Overview</h2>
                  <button
                    className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                      setFormData({});
                      setModalOpen('routes');
                    }}
                    aria-label="Add new route"
                  >
                    Add Route
                  </button>
                  <button
                    className="mb-4 ml-2 px-4 py-2 bg-green-500 text-white rounded"
                    onClick={() => exportToCSV(routesData, 'routes')}
                    aria-label="Export routes to CSV"
                  >
                    Export to CSV
                  </button>
                  <ul>
                    {routesData.length ? (
                      routesData.map((item) => (
                        <li key={item.id} className="p-2 border-b flex justify-between">
                          <span>
                            Route: {item.routeName || 'N/A'} - Distance: {item.returnDistance || 'N/A'} km - Tonnage: {item.tonnage || 'N/A'} - Rate/Ton: ${item.ratePerTon || 0}
                          </span>
                          <div>
                            <button
                              className="text-blue-500 mr-2"
                              onClick={() => {
                                setFormData(item);
                                setModalOpen('routes');
                              }}
                              aria-label={`Edit route ${item.routeName}`}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500"
                              onClick={() => handleDelete('routes', item.id)}
                              aria-label={`Delete route ${item.routeName}`}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p>No routes data available.</p>
                    )}
                  </ul>
                </div>
              )}
              {activeTab === 'costs' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Costs Overview</h2>
                  <button
                    className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                      setFormData({});
                      setModalOpen('costs');
                    }}
                    aria-label="Add new cost"
                  >
                    Add Cost
                  </button>
                  <button
                    className="mb-4 ml-2 px-4 py-2 bg-green-500 text-white rounded"
                    onClick={() => exportToCSV(costsData, 'costs')}
                    aria-label="Export costs to CSV"
                  >
                    Export to CSV
                  </button>
                  {costsData.length ? (
                    <div className="max-w-2xl">
                      <Bar data={chartData} options={chartOptions} />
                      <ul className="mt-4">
                        {costsData.map((item) => (
                          <li key={item.id} className="p-2 border-b flex justify-between">
                            <span>
                              Date: {item.date || 'N/A'} - Amount: ${item.amount || 0}
                            </span>
                            <div>
                              <button
                                className="text-blue-500 mr-2"
                                onClick={() => {
                                  setFormData(item);
                                  setModalOpen('costs');
                                }}
                                aria-label={`Edit cost ${item.date}`}
                              >
                                Edit
                              </button>
                              <button
                                className="text-red-500"
                                onClick={() => handleDelete('costs', item.id)}
                                aria-label={`Delete cost ${item.date}`}
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>No costs data available.</p>
                  )}
                </div>
              )}
              {activeTab === 'profitability' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Annual Profitability Summary</h2>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-300 p-2">Metric</th>
                        <th className="border border-gray-300 p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Loads</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalLoads.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Distance (km)</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalDistance.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Revenue ($)</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalRevenue.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Costs ($)</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalCosts.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Profit ($)</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalProfit.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Average Margin (%)</td>
                        <td className={`border border-gray-300 p-2 ${getProfitabilityIndicator(annualSummary.averageMargin).color}`}>
                          {annualSummary.averageMargin.toFixed(2)}% ({getProfitabilityIndicator(annualSummary.averageMargin).text})
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Break-even Loads</td>
                        <td className="border border-gray-300 p-2">{annualSummary.breakEvenLoads.toFixed(0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {modalOpen && (
                <Modal
                  type={modalOpen}
                  data={formData}
                  onSave={formData.id ? handleEdit : handleAdd}
                  onClose={() => {
                    setModalOpen(null);
                    setFormData({});
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HaulyticsDashboard;
EOFcd /Users/langaludidi/Desktop/haulytics-project
cat > src/HaulyticsDashboard.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { BarChart3, MapPin, DollarSign, TrendingUp } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { db, auth } from './firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import toast, { Toaster } from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const HaulyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [fleetData, setFleetData] = useState([]);
  const [routesData, setRoutesData] = useState([]);
  const [costsData, setCostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signInAnonymously(auth)
          .then(() => toast.success('Signed in anonymously'))
          .catch((error) => toast.error(`Auth error: ${error.message}`));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const fleetSnapshot = await getDocs(
          collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/fleet`)
        );
        const fleet = fleetSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setFleetData(fleet);

        const routesSnapshot = await getDocs(
          collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/routes`)
        );
        const routes = routesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRoutesData(routes);

        const costsSnapshot = await getDocs(
          collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/costs`)
        );
        const costs = costsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCostsData(costs);

        setLoading(false);
      } catch (error) {
        toast.error(`Error fetching data: ${error.message}`);
        setLoading(false);
      }
    };

    if (auth.currentUser) fetchData();
  }, []);

  const validateFleetVehicle = (data) => {
    if (!data.vehicleName || !data.status) return 'Vehicle name and status are required';
    return null;
  };

  const validateRoute = (data) => {
    if (!data.routeName || !data.tonnage || !data.ratePerTon || !data.loadsPerMonth || !data.returnDistance)
      return 'All route fields are required';
    if (data.tonnage <= 0 || data.ratePerTon <= 0 || data.loadsPerMonth <= 0 || data.returnDistance <= 0)
      return 'Numeric fields must be positive';
    return null;
  };

  const validateCosts = (data) => {
    if (!data.date || !data.amount) return 'Date and amount are required';
    if (data.amount <= 0) return 'Amount must be positive';
    return null;
  };

  const handleAdd = async (type, data) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      let validationError;
      if (type === 'fleet') validationError = validateFleetVehicle(data);
      else if (type === 'routes') validationError = validateRoute(data);
      else if (type === 'costs') validationError = validateCosts(data);

      if (validationError) {
        toast.error(validationError);
        return;
      }

      const collectionRef = collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`);
      await addDoc(collectionRef, data);
      toast.success(`${type} added successfully`);
      setModalOpen(null);
      setFormData({});
      const snapshot = await getDocs(collectionRef);
      if (type === 'fleet') setFleetData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'routes') setRoutesData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'costs') setCostsData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error(`Error adding ${type}: ${error.message}`);
    }
  };

  const handleEdit = async (type, id, data) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      let validationError;
      if (type === 'fleet') validationError = validateFleetVehicle(data);
      else if (type === 'routes') validationError = validateRoute(data);
      else if (type === 'costs') validationError = validateCosts(data);

      if (validationError) {
        toast.error(validationError);
        return;
      }

      const docRef = doc(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`, id);
      await updateDoc(docRef, data);
      toast.success(`${type} updated successfully`);
      setModalOpen(null);
      setFormData({});
      const collectionRef = collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`);
      const snapshot = await getDocs(collectionRef);
      if (type === 'fleet') setFleetData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'routes') setRoutesData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'costs') setCostsData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error(`Error updating ${type}: ${error.message}`);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      const docRef = doc(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`, id);
      await deleteDoc(docRef);
      toast.success(`${type} deleted successfully`);
      const collectionRef = collection(db, `artifacts/${import.meta.env.VITE_APP_ID}/users/${userId}/${type}`);
      const snapshot = await getDocs(collectionRef);
      if (type === 'fleet') setFleetData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'routes') setRoutesData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      else if (type === 'costs') setCostsData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error(`Error deleting ${type}: ${error.message}`);
    }
  };

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).filter((key) => key !== 'id');
    const csvRows = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => `"${row[header] || ''}"`).join(',')),
    ];
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${filename} to CSV`);
  };

  const chartData = {
    labels: costsData.map((item) => item.date || 'Unknown'),
    datasets: [
      {
        label: 'Costs ($)',
        data: costsData.map((item) => item.amount || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Monthly Costs' },
    },
  };

  const annualSummary = routesData.reduce(
    (acc, route) => {
      const loadsPerYear = (route.loadsPerMonth || 0) * 12;
      const revenue = loadsPerYear * (route.ratePerTon || 0) * (route.tonnage || 0);
      const distance = loadsPerYear * (route.returnDistance || 0);
      const totalCosts = costsData.reduce((sum, cost) => sum + (cost.amount || 0), 0);
      const profit = revenue - totalCosts;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const breakEvenLoads = totalCosts / ((route.ratePerTon || 0) * (route.tonnage || 0));

      return {
        totalLoads: acc.totalLoads + loadsPerYear,
        totalDistance: acc.totalDistance + distance,
        totalRevenue: acc.totalRevenue + revenue,
        totalCosts: acc.totalCosts + totalCosts,
        totalProfit: acc.totalProfit + profit,
        averageMargin: acc.totalRevenue > 0 ? (acc.totalProfit / acc.totalRevenue) * 100 : 0,
        breakEvenLoads: acc.breakEvenLoads + breakEvenLoads,
      };
    },
    {
      totalLoads: 0,
      totalDistance: 0,
      totalRevenue: 0,
      totalCosts: 0,
      totalProfit: 0,
      averageMargin: 0,
      breakEvenLoads: 0,
    }
  );

  const getProfitabilityIndicator = (margin) => {
    if (margin >= 30) return { text: 'Excellent', color: 'text-green-500' };
    if (margin >= 15) return { text: 'Good', color: 'text-blue-500' };
    if (margin >= 5) return { text: 'Marginal', color: 'text-yellow-500' };
    return { text: 'Poor', color: 'text-red-500' };
  };

  const Modal = ({ type, data = {}, onSave, onClose }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center" role="dialog" aria-labelledby={`${type}-modal-title`}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 id={`${type}-modal-title`} className="text-xl font-semibold mb-4">
          {data.id ? `Edit ${type}` : `Add ${type}`}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(type, data.id || null, formData);
          }}
        >
          {type === 'fleet' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="vehicleName">Vehicle Name</label>
                <input
                  id="vehicleName"
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.vehicleName || ''}
                  onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="status">Status</label>
                <input
                  id="status"
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.status || ''}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  aria-required="true"
                />
              </div>
            </>
          )}
          {type === 'routes' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="routeName">Route Name</label>
                <input
                  id="routeName"
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData.routeName || ''}
                  onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="tonnage">Tonnage</label>
                <input
                  id="tonnage"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.tonnage || ''}
                  onChange={(e) => setFormData({ ...formData, tonnage: parseFloat(e.target.value) })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="ratePerTon">Rate per Ton ($)</label>
                <input
                  id="ratePerTon"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.ratePerTon || ''}
                  onChange={(e) => setFormData({ ...formData, ratePerTon: parseFloat(e.target.value) })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="loadsPerMonth">Loads per Month</label>
                <input
                  id="loadsPerMonth"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.loadsPerMonth || ''}
                  onChange={(e) => setFormData({ ...formData, loadsPerMonth: parseInt(e.target.value) })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="returnDistance">Return Distance (km)</label>
                <input
                  id="returnDistance"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.returnDistance || ''}
                  onChange={(e) => setFormData({ ...formData, returnDistance: parseFloat(e.target.value) })}
                  aria-required="true"
                />
              </div>
            </>
          )}
          {type === 'costs' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  className="w-full p-2 border rounded"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  aria-required="true"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium" htmlFor="amount">Amount ($)</label>
                <input
                  id="amount"
                  type="number"
                  className="w-full p-2 border rounded"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  aria-required="true"
                />
              </div>
            </>
          )}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={onClose}
              aria-label={`Close ${type} modal`}
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" aria-label={`Save ${type}`}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      <header className="bg-white shadow p-4 flex items-center">
        <img src="/src/assets/logo.png" alt="Haulytics Logo" className="h-10 mr-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold">Haulytics Dashboard</h1>
      </header>

      <div className="p-4">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div
                className="bg-white p-4 rounded shadow cursor-pointer"
                onClick={() => setActiveTab('fleet')}
                role="button"
                aria-label="Fleet Overview"
              >
                <h3 className="text-lg font-semibold">Fleet Size</h3>
                <p>{fleetData.length} vehicles</p>
              </div>
              <div
                className="bg-white p-4 rounded shadow cursor-pointer"
                onClick={() => setActiveTab('routes')}
                role="button"
                aria-label="Active Routes"
              >
                <h3 className="text-lg font-semibold">Active Routes</h3>
                <p>{routesData.length} routes</p>
              </div>
              <div
                className="bg-white p-4 rounded shadow cursor-pointer"
                onClick={() => setActiveTab('costs')}
                role="button"
                aria-label="Total Costs"
              >
                <h3 className="text-lg font-semibold">Total Costs</h3>
                <p>${annualSummary.totalCosts.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex border-b mx-4">
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'overview' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('overview')}
                aria-selected={activeTab === 'overview'}
                role="tab"
              >
                <TrendingUp className="mr-2" /> Overview
              </button>
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'fleet' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('fleet')}
                aria-selected={activeTab === 'fleet'}
                role="tab"
              >
                <BarChart3 className="mr-2" /> Fleet
              </button>
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'routes' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('routes')}
                aria-selected={activeTab === 'routes'}
                role="tab"
              >
                <MapPin className="mr-2" /> Routes
              </button>
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'costs' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('costs')}
                aria-selected={activeTab === 'costs'}
                role="tab"
              >
                <DollarSign className="mr-2" /> Costs
              </button>
              <button
                className={`px-4 py-2 flex items-center ${activeTab === 'profitability' ? 'border-b-2 border-blue-500' : ''}`}
                onClick={() => setActiveTab('profitability')}
                aria-selected={activeTab === 'profitability'}
                role="tab"
              >
                <TrendingUp className="mr-2" /> Profitability
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'overview' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
                  <p>Welcome to the Haulytics Dashboard, your tool for managing trucking operations.</p>
                </div>
              )}
              {activeTab === 'fleet' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Fleet Overview</h2>
                  <button
                    className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                      setFormData({});
                      setModalOpen('fleet');
                    }}
                    aria-label="Add new vehicle"
                  >
                    Add Vehicle
                  </button>
                  <button
                    className="mb-4 ml-2 px-4 py-2 bg-green-500 text-white rounded"
                    onClick={() => exportToCSV(fleetData, 'fleet')}
                    aria-label="Export fleet to CSV"
                  >
                    Export to CSV
                  </button>
                  <ul>
                    {fleetData.length ? (
                      fleetData.map((item) => (
                        <li key={item.id} className="p-2 border-b flex justify-between">
                          <span>
                            Vehicle: {item.vehicleName || 'N/A'} - Status: {item.status || 'N/A'}
                          </span>
                          <div>
                            <button
                              className="text-blue-500 mr-2"
                              onClick={() => {
                                setFormData(item);
                                setModalOpen('fleet');
                              }}
                              aria-label={`Edit vehicle ${item.vehicleName}`}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500"
                              onClick={() => handleDelete('fleet', item.id)}
                              aria-label={`Delete vehicle ${item.vehicleName}`}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p>No fleet data available.</p>
                    )}
                  </ul>
                </div>
              )}
              {activeTab === 'routes' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Routes Overview</h2>
                  <button
                    className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                      setFormData({});
                      setModalOpen('routes');
                    }}
                    aria-label="Add new route"
                  >
                    Add Route
                  </button>
                  <button
                    className="mb-4 ml-2 px-4 py-2 bg-green-500 text-white rounded"
                    onClick={() => exportToCSV(routesData, 'routes')}
                    aria-label="Export routes to CSV"
                  >
                    Export to CSV
                  </button>
                  <ul>
                    {routesData.length ? (
                      routesData.map((item) => (
                        <li key={item.id} className="p-2 border-b flex justify-between">
                          <span>
                            Route: {item.routeName || 'N/A'} - Distance: {item.returnDistance || 'N/A'} km - Tonnage: {item.tonnage || 'N/A'} - Rate/Ton: ${item.ratePerTon || 0}
                          </span>
                          <div>
                            <button
                              className="text-blue-500 mr-2"
                              onClick={() => {
                                setFormData(item);
                                setModalOpen('routes');
                              }}
                              aria-label={`Edit route ${item.routeName}`}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-500"
                              onClick={() => handleDelete('routes', item.id)}
                              aria-label={`Delete route ${item.routeName}`}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <p>No routes data available.</p>
                    )}
                  </ul>
                </div>
              )}
              {activeTab === 'costs' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Costs Overview</h2>
                  <button
                    className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
                    onClick={() => {
                      setFormData({});
                      setModalOpen('costs');
                    }}
                    aria-label="Add new cost"
                  >
                    Add Cost
                  </button>
                  <button
                    className="mb-4 ml-2 px-4 py-2 bg-green-500 text-white rounded"
                    onClick={() => exportToCSV(costsData, 'costs')}
                    aria-label="Export costs to CSV"
                  >
                    Export to CSV
                  </button>
                  {costsData.length ? (
                    <div className="max-w-2xl">
                      <Bar data={chartData} options={chartOptions} />
                      <ul className="mt-4">
                        {costsData.map((item) => (
                          <li key={item.id} className="p-2 border-b flex justify-between">
                            <span>
                              Date: {item.date || 'N/A'} - Amount: ${item.amount || 0}
                            </span>
                            <div>
                              <button
                                className="text-blue-500 mr-2"
                                onClick={() => {
                                  setFormData(item);
                                  setModalOpen('costs');
                                }}
                                aria-label={`Edit cost ${item.date}`}
                              >
                                Edit
                              </button>
                              <button
                                className="text-red-500"
                                onClick={() => handleDelete('costs', item.id)}
                                aria-label={`Delete cost ${item.date}`}
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>No costs data available.</p>
                  )}
                </div>
              )}
              {activeTab === 'profitability' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Annual Profitability Summary</h2>
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-300 p-2">Metric</th>
                        <th className="border border-gray-300 p-2">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Loads</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalLoads.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Distance (km)</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalDistance.toFixed(0)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Revenue ($)</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalRevenue.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Costs ($)</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalCosts.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Total Annual Profit ($)</td>
                        <td className="border border-gray-300 p-2">{annualSummary.totalProfit.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Average Margin (%)</td>
                        <td className={`border border-gray-300 p-2 ${getProfitabilityIndicator(annualSummary.averageMargin).color}`}>
                          {annualSummary.averageMargin.toFixed(2)}% ({getProfitabilityIndicator(annualSummary.averageMargin).text})
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Break-even Loads</td>
                        <td className="border border-gray-300 p-2">{annualSummary.breakEvenLoads.toFixed(0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {modalOpen && (
                <Modal
                  type={modalOpen}
                  data={formData}
                  onSave={formData.id ? handleEdit : handleAdd}
                  onClose={() => {
                    setModalOpen(null);
                    setFormData({});
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HaulyticsDashboard;
