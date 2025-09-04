import React, { useState, useEffect } from 'react';
import { BarChart3, MapPin, DollarSign } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import firebaseConfig from './firebaseConfig';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = import.meta.env.VITE_APP_ID;

function HaulyticsDashboard() {
  const [activeTab, setActiveTab] = useState('fleet');
  const [fleetData, setFleetData] = useState([]);
  const [routesData, setRoutesData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function initializeAuth() {
      try {
        const token = import.meta.env.VITE_INITIAL_AUTH_TOKEN || null;
        if (token) {
          await signInWithCustomToken(auth, token);
        } else {
          await signInAnonymously(auth);
        }
        setUserId(auth.currentUser.uid);
      } catch (error) {
        console.error('Auth error:', error);
      }
    }
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const collections = [
      { name: 'fleet', setter: setFleetData },
      { name: 'routes', setter: setRoutesData },
      { name: 'costs', setter: setCostData }
    ];
    const unsubscribes = collections.map(({ name, setter }) =>
      onSnapshot(collection(db, `artifacts/${appId}/users/${userId}/${name}`), (snapshot) => {
        setter(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      })
    );
    return () => unsubscribes.forEach(unsub => unsub());
  }, [userId]);

  const chartData = {
    labels: costData.map(item => item.date),
    datasets: [
      {
        label: 'Costs',
        data: costData.map(item => item.amount),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const tabs = [
    { id: 'fleet', label: 'Fleet', icon: <BarChart3 size={24} /> },
    { id: 'routes', label: 'Routes', icon: <MapPin size={24} /> },
    { id: 'costs', label: 'Costs', icon: <DollarSign size={24} /> }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <img src="https://via.placeholder.com/40" alt="Haulytics Logo" className="h-10 mr-4" />
            <h1 className="text-2xl font-bold">Haulytics</h1>
          </div>
          <nav>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`mx-2 p-2 ${activeTab === tab.id ? 'border-b-2 border-white' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {activeTab === 'fleet' && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Fleet Management</h2>
            <ul>
              {fleetData.map(item => (
                <li key={item.id} className="p-2 border-b">{item.vehicleName} - {item.status}</li>
              ))}
            </ul>
          </section>
        )}
        {activeTab === 'routes' && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Route Planning</h2>
            <ul>
              {routesData.map(item => (
                <li key={item.id} className="p-2 border-b">{item.routeName} - {item.distance} km</li>
              ))}
            </ul>
          </section>
        )}
        {activeTab === 'costs' && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Cost Tracking</h2>
            <Bar data={chartData} />
          </section>
        )}
      </main>
    </div>
  );
}

export default HaulyticsDashboard;
