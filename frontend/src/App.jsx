import React, { useState, useEffect } from 'react';
import { getAuthToken, getUser, clearAuth } from './api';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import PublishProductsPage from './pages/PublishProductsPage';
import CategoriesBrandsPage from './pages/CategoriesBrandsPage';
import CustomersPage from './pages/CustomersPage';
import NewSalePage from './pages/NewSalePage';
import SalesListPage from './pages/SalesListPage';
import SaleItemsPage from './pages/SaleItemsPage';
import DailyReportPage from './pages/DailyReportPage';
import MonthlyReportPage from './pages/MonthlyReportPage';
import StockReportPage from './pages/StockReportPage';
import ExpensesPage from './pages/ExpensesPage';
import ExpenseCategoriesPage from './pages/ExpenseCategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import UsersPage from './pages/UsersPage';
import CustomerStorefrontPage from './pages/CustomerStorefrontPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(getUser());
  const [currentTab, setCurrentTab] = useState(getUser() ? 'dashboard' : 'login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    const handleAuthLogout = () => {
      setCurrentUser(null);
      setCurrentTab('login');
      showToast('Session expired. Please log in again.', 'error');
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
    showToast(`Welcome back, ${user.username}!`, 'success');
  };

  const handleGoToStore = () => {
    setCurrentTab('storefront');
  };

  const handleBackToPortal = () => {
    if (getAuthToken()) {
      setCurrentTab('dashboard');
    } else {
      setCurrentTab('login');
    }
  };

  // If viewing customer storefront
  if (currentTab === 'storefront') {
    return (
      <>
        <CustomerStorefrontPage onBackToPortal={handleBackToPortal} />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // If not logged in
  if (!currentUser || currentTab === 'login') {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onGoToStore={handleGoToStore}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // Main Authenticated Dashboard Layout
  return (
    <div className="app-container">
      <Navbar
        onNavigate={setCurrentTab}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="main-layout">
        <Sidebar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          isOpen={isSidebarOpen}
        />

        <main className="content-area">
          {currentTab === 'dashboard' && (
            <DashboardPage onNavigate={setCurrentTab} showToast={showToast} />
          )}
          {currentTab === 'products' && (
            <ProductsPage showToast={showToast} />
          )}
          {currentTab === 'categories_brands' && (
            <CategoriesBrandsPage showToast={showToast} />
          )}
          {currentTab === 'publish' && (
            <PublishProductsPage showToast={showToast} />
          )}
          {currentTab === 'customers' && (
            <CustomersPage showToast={showToast} />
          )}
          {currentTab === 'new_sale' && (
            <NewSalePage showToast={showToast} />
          )}
          {currentTab === 'sales_list' && (
            <SalesListPage showToast={showToast} />
          )}
          {currentTab === 'sale_items' && (
            <SaleItemsPage showToast={showToast} />
          )}
          {currentTab === 'daily_report' && (
            <DailyReportPage showToast={showToast} />
          )}
          {currentTab === 'monthly_report' && (
            <MonthlyReportPage showToast={showToast} />
          )}
          {currentTab === 'stock_report' && (
            <StockReportPage showToast={showToast} />
          )}
          {currentTab === 'expenses' && (
            <ExpensesPage showToast={showToast} />
          )}
          {currentTab === 'expense_categories' && (
            <ExpenseCategoriesPage showToast={showToast} />
          )}
          {currentTab === 'budgets' && (
            <BudgetsPage showToast={showToast} />
          )}
          {currentTab === 'users' && (
            <UsersPage showToast={showToast} />
          )}
        </main>
      </div>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
