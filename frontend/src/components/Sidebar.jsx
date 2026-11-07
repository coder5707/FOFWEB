import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  UploadCloud,
  ShoppingCart,
  Receipt,
  ListOrdered,
  Users,
  Calendar,
  BarChart3,
  Boxes,
  Wallet,
  FolderKanban,
  Target,
  ShieldCheck,
  Store
} from 'lucide-react';
import { getUser } from '../api';

export default function Sidebar({ currentTab, onNavigate, isOpen }) {
  const user = getUser();
  const isAdmin = user && user.role === 'admin';

  const navItems = [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },

    { section: 'Inventory' },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories_brands', label: 'Categories & Brands', icon: Layers },
    ...(isAdmin ? [{ id: 'publish', label: 'Publish to Store', icon: UploadCloud }] : []),
    { id: 'stock_report', label: 'Stock Report', icon: Boxes },

    { section: 'Sales & POS' },
    { id: 'new_sale', label: 'New Sale (Billing)', icon: ShoppingCart },
    { id: 'sales_list', label: 'Sales History', icon: Receipt },
    { id: 'sale_items', label: 'Sale Items Detail', icon: ListOrdered },
    { id: 'customers', label: 'Customers', icon: Users },

    { section: 'Reports' },
    { id: 'daily_report', label: 'Daily Report', icon: Calendar },
    { id: 'monthly_report', label: 'Monthly Report', icon: BarChart3 },

    { section: 'Expenses & Budget' },
    { id: 'expenses', label: 'Expense Tracker', icon: Wallet },
    { id: 'expense_categories', label: 'Expense Categories', icon: FolderKanban },
    { id: 'budgets', label: 'Budget Management', icon: Target },

    ...(isAdmin ? [
      { section: 'Administration' },
      { id: 'users', label: 'Staff & Users', icon: ShieldCheck }
    ] : []),

    { section: 'Customer View' },
    { id: 'storefront', label: 'Storefront', icon: Store }
  ];

  if (!isOpen) return null;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={`sec-${idx}`} className="nav-section-title">
                {item.section}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
