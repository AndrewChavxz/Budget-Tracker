// src/App.js
import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './App.css';
ChartJS.register(ArcElement, Tooltip, Legend);

const App = () => {
  const [user, setUser] = useState(localStorage.getItem('budget_user') || '');
  const [transactions, setTransactions] = useState(() => JSON.parse(localStorage.getItem('budget_data')) || []);
  const [view, setView] = useState('chart');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('income');
  const [limits, setLimits] = useState(() => JSON.parse(localStorage.getItem('budget_limits')) || {});
  const [goals, setGoals] = useState(() => JSON.parse(localStorage.getItem('budget_goals')) || []);

  const [newUser, setNewUser] = useState('');
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  useEffect(() => {
    localStorage.setItem('budget_data', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budget_limits', JSON.stringify(limits));
  }, [limits]);

  useEffect(() => {
    localStorage.setItem('budget_goals', JSON.stringify(goals));
  }, [goals]);

  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const txn = { description, amount: parseFloat(amount), type };
    setTransactions([txn, ...transactions]);
    setDescription('');
    setAmount('');
    setType('income');
  };

  const handleDeleteTransaction = (index) => {
    setTransactions(transactions.filter((_, i) => i !== index));
  };

  const categoryTotals = transactions.reduce((totals, txn) => {
    if (txn.type === 'expense') {
      const cat = txn.description.toLowerCase();
      totals[cat] = (totals[cat] || 0) + txn.amount;
    }
    return totals;
  }, {});

  const chartData = {
    labels: transactions.filter(t => t.type === 'expense').map(t => t.description),
    datasets: [
      {
        data: transactions.filter(t => t.type === 'expense').map(t => t.amount),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
      }
    ]
  };

  if (!user) {
    return (
      <div className="dashboard">
        <h2>Login</h2>
        <input
          placeholder="Enter your name"
          value={newUser}
          onChange={(e) => setNewUser(e.target.value)}
        />
        <button onClick={() => {
          localStorage.setItem('budget_user', newUser);
          setUser(newUser);
        }}>Enter</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2>Welcome, {user}!</h2>
      <div className="button-group">
        <button onClick={() => setView('chart')}>Pie Chart</button>
        <button onClick={() => setView('history')}>Transaction History</button>
        <button onClick={() => setView('add')}>Add Transaction</button>
        <button onClick={() => setView('limits')}>Set Budget Limits</button>
        <button onClick={() => setView('goals')}>Set Savings Goals</button>
      </div>
      <button className="logout" onClick={() => {
        localStorage.removeItem('budget_user');
        setUser('');
      }}>Log Out</button>

      {view === 'chart' && (
        <div className="chart">
          <h4>Expense Breakdown</h4>
          <Pie data={chartData} />
        </div>
      )}

      {view === 'history' && (
        <div>
          <h4>Income: ${income.toFixed(2)}</h4>
          <h4>Expense: ${expense.toFixed(2)}</h4>
          <ul>
            {transactions.map((t, i) => (
              <li key={i} className={t.type}>
                {t.description} - ${t.amount} ({t.type})
                <button onClick={() => handleDeleteTransaction(i)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === 'add' && (
        <form onSubmit={handleAddTransaction}>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" required />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <button type="submit">Add</button>
        </form>
      )}

      {view === 'limits' && (
        <div>
          <h4>Set Budget Limits</h4>
          <form onSubmit={(e) => {
            e.preventDefault();
            setLimits({ ...limits, [category.toLowerCase()]: parseFloat(limit) });
            setCategory('');
            setLimit('');
          }}>
            <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} required />
            <input type="number" placeholder="Limit ($)" value={limit} onChange={(e) => setLimit(e.target.value)} required />
            <button type="submit">Set Limit</button>
          </form>
          {Object.entries(limits).map(([cat, lim]) => (
            <div key={cat}>
              <strong>{cat}</strong>: ${lim} — Spent: ${categoryTotals[cat] || 0}
              {categoryTotals[cat] > lim && <span style={{ color: 'red' }}> ⚠ Over budget!</span>}
            </div>
          ))}
        </div>
      )}

      {view === 'goals' && (
        <div>
          <h4>Set Savings Goals</h4>
          <form onSubmit={(e) => {
            e.preventDefault();
            setGoals([...goals, { name: goalName, target: parseFloat(goalTarget) }]);
            setGoalName('');
            setGoalTarget('');
          }}>
            <input placeholder="Goal Name" value={goalName} onChange={(e) => setGoalName(e.target.value)} required />
            <input type="number" placeholder="Target ($)" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} required />
            <button type="submit">Add Goal</button>
          </form>
          {goals.map((g, i) => {
            const progress = Math.min(100, ((income - expense) / g.target) * 100);
            return (
              <div key={i}>
                <strong>{g.name}</strong>: ${g.target} — Progress: {progress.toFixed(1)}%
                <div style={{ background: '#333', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, background: 'limegreen', height: '100%' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default App;
