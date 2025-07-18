import React, { useState, useEffect } from 'react';
import api from '../../api';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    totalAssets: 0,
    totalProjects: 0,
    totalRevenue: 0,
    recentTransactions: [],
    userGrowth: [],
    popularCategories: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      // Note: These endpoints would need to be implemented in the backend
      const [users, assets, projects] = await Promise.all([
        api.get('/users/'),
        api.get('/creative-assets/'),
        api.get('/projects/')
      ]);

      // Calculate analytics from the data
      const totalUsers = users.data.results?.length || users.data.length || 0;
      const totalAssets = assets.data.results?.length || assets.data.length || 0;
      const totalProjects = projects.data.results?.length || projects.data.length || 0;

      // Mock revenue calculation (in a real app, this would come from payment data)
      const mockRevenue = totalAssets * 25.99 + totalProjects * 150.00;

      setAnalytics({
        totalUsers,
        totalAssets,
        totalProjects,
        totalRevenue: mockRevenue,
        recentTransactions: generateMockTransactions(5),
        userGrowth: generateMockGrowthData(),
        popularCategories: generateMockCategoryData()
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTransactions = (count) => {
    const transactions = [];
    for (let i = 0; i < count; i++) {
      transactions.push({
        id: i + 1,
        type: Math.random() > 0.5 ? 'Asset Purchase' : 'Project Payment',
        amount: Math.floor(Math.random() * 500) + 50,
        user: `User ${i + 1}`,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
    }
    return transactions;
  };

  const generateMockGrowthData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 7);
      data.push({
        week: date.toLocaleDateString(),
        users: Math.floor(Math.random() * 50) + 20,
        assets: Math.floor(Math.random() * 30) + 10,
        projects: Math.floor(Math.random() * 20) + 5
      });
    }
    return data;
  };

  const generateMockCategoryData = () => {
    return [
      { name: 'Graphics & Design', count: 45, percentage: 35 },
      { name: 'Web Development', count: 32, percentage: 25 },
      { name: 'Mobile Apps', count: 28, percentage: 22 },
      { name: 'Digital Marketing', count: 23, percentage: 18 }
    ];
  };

  if (isLoading) {
    return (
      <div className="admin-analytics-loading">
        <div className="admin-spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h2>Platform Analytics</h2>
        <div className="analytics-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="analytics-cards">
        <div className="analytics-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Users</h3>
            <div className="card-value">{analytics.totalUsers}</div>
            <div className="card-change positive">+12% this month</div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">🎨</div>
          <div className="card-content">
            <h3>Creative Assets</h3>
            <div className="card-value">{analytics.totalAssets}</div>
            <div className="card-change positive">+8% this month</div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">📋</div>
          <div className="card-content">
            <h3>Active Projects</h3>
            <div className="card-value">{analytics.totalProjects}</div>
            <div className="card-change positive">+15% this month</div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Revenue</h3>
            <div className="card-value">${analytics.totalRevenue.toLocaleString()}</div>
            <div className="card-change positive">+22% this month</div>
          </div>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-section">
          <h3>Growth Trends</h3>
          <div className="growth-chart">
            {analytics.userGrowth.map((week, index) => (
              <div key={index} className="growth-bar">
                <div className="growth-week">{week.week}</div>
                <div className="growth-metrics">
                  <div className="metric users" style={{height: `${week.users}px`}} title={`${week.users} new users`}></div>
                  <div className="metric assets" style={{height: `${week.assets}px`}} title={`${week.assets} new assets`}></div>
                  <div className="metric projects" style={{height: `${week.projects}px`}} title={`${week.projects} new projects`}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color users"></div>
              <span>Users</span>
            </div>
            <div className="legend-item">
              <div className="legend-color assets"></div>
              <span>Assets</span>
            </div>
            <div className="legend-item">
              <div className="legend-color projects"></div>
              <span>Projects</span>
            </div>
          </div>
        </div>

        <div className="chart-section">
          <h3>Popular Categories</h3>
          <div className="category-chart">
            {analytics.popularCategories.map((category, index) => (
              <div key={index} className="category-item">
                <div className="category-info">
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{category.count} items</span>
                </div>
                <div className="category-bar">
                  <div 
                    className="category-fill" 
                    style={{width: `${category.percentage}%`}}
                  ></div>
                </div>
                <span className="category-percentage">{category.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="recent-transactions">
        <h3>Recent Transactions</h3>
        <div className="transactions-table">
          <div className="table-header">
            <div>Type</div>
            <div>User</div>
            <div>Amount</div>
            <div>Date</div>
          </div>
          {analytics.recentTransactions.map(transaction => (
            <div key={transaction.id} className="table-row">
              <div className="transaction-type">{transaction.type}</div>
              <div className="transaction-user">{transaction.user}</div>
              <div className="transaction-amount">${transaction.amount}</div>
              <div className="transaction-date">{transaction.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
