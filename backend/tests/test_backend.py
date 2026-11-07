import io
import os
import sys
import pytest
from openpyxl import load_workbook

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database import get_direct_db_conn
from init_db import init_db

@pytest.fixture(scope='session')
def app_instance():
    # Use standard testing database
    test_db = os.path.abspath(os.path.join(os.path.dirname(__file__), 'test_retail.db'))
    if os.path.exists(test_db):
        os.remove(test_db)
    
    app = create_app()
    app.config['DATABASE_PATH'] = test_db
    app.config['TESTING'] = True

    with app.app_context():
        init_db(test_db)

    yield app

    if os.path.exists(test_db):
        os.remove(test_db)

@pytest.fixture
def client(app_instance):
    return app_instance.test_client()

@pytest.fixture
def admin_token(client):
    res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    data = res.get_json()
    assert res.status_code == 200
    assert data['success'] is True
    return data['token']

@pytest.fixture
def staff_token(client):
    res = client.post('/api/auth/login', json={'username': 'staff', 'password': 'staff123'})
    data = res.get_json()
    assert res.status_code == 200
    assert data['success'] is True
    return data['token']

def test_health(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    assert res.get_json()['status'] == 'healthy'

def test_login_invalid(client):
    res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrongpassword'})
    assert res.status_code == 401
    assert res.get_json()['success'] is False

def test_customer_login(client):
    res = client.post('/api/auth/login', json={'login_type': 'user'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['role'] == 'customer'

def test_dashboard_metrics(client, admin_token):
    res = client.get('/api/dashboard/metrics', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    metrics = data['metrics']
    assert 'total_products' in metrics
    assert 'total_stock' in metrics
    assert 'stock_percent' in metrics
    assert 'expenses' in metrics

def test_product_crud_and_publish(client, admin_token):
    # 1. Create product
    new_prod = {
        'name': 'Test Silk Shirt',
        'category': 'Mens Wear',
        'brand': 'Raymond',
        'size': 'L',
        'color': 'Blue',
        'price': 1250.00,
        'stock': 25
    }
    create_res = client.post('/api/products', json=new_prod, headers={'Authorization': f'Bearer {admin_token}'})
    assert create_res.status_code == 201
    prod_id = create_res.get_json()['id']

    # 2. Get product
    get_res = client.get(f'/api/products/{prod_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert get_res.status_code == 200
    assert get_res.get_json()['data']['name'] == 'Test Silk Shirt'

    # 3. Update product
    update_res = client.put(f'/api/products/{prod_id}', json={'name': 'Test Silk Shirt Updated', 'price': 1300.00, 'stock': 30}, headers={'Authorization': f'Bearer {admin_token}'})
    assert update_res.status_code == 200

    # 4. Publish product
    pub_res = client.post(f'/api/products/{prod_id}/publish', headers={'Authorization': f'Bearer {admin_token}'})
    assert pub_res.status_code == 200

    # 5. Check storefront
    store_res = client.get('/api/products/storefront')
    assert store_res.status_code == 200
    prods = store_res.get_json()['data']
    assert any(p['id'] == prod_id for p in prods)

    # 6. Unpublish
    unpub_res = client.post(f'/api/products/{prod_id}/unpublish', headers={'Authorization': f'Bearer {admin_token}'})
    assert unpub_res.status_code == 200

    # 7. Soft Delete
    del_res = client.delete(f'/api/products/{prod_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert del_res.status_code == 200

    # 8. Restore
    restore_res = client.post(f'/api/products/{prod_id}/restore', headers={'Authorization': f'Bearer {admin_token}'})
    assert restore_res.status_code == 200

def test_sales_and_atomic_stock_deduction(client, admin_token):
    # Create product with stock = 10
    prod_res = client.post('/api/products', json={
        'name': 'Stock Deduction Test Item',
        'price': 500.00,
        'stock': 10
    }, headers={'Authorization': f'Bearer {admin_token}'})
    prod_id = prod_res.get_json()['id']

    # Test failure on insufficient stock (request 15 when only 10 available)
    fail_sale = client.post('/api/sales', json={
        'customer_name': 'Test Customer',
        'items': [{'product_id': prod_id, 'quantity': 15, 'unit_price': 500.00}]
    }, headers={'Authorization': f'Bearer {admin_token}'})
    assert fail_sale.status_code == 400
    assert 'Insufficient stock' in fail_sale.get_json()['message']

    # Verify stock remained 10
    check_prod = client.get(f'/api/products/{prod_id}', headers={'Authorization': f'Bearer {admin_token}'}).get_json()['data']
    assert check_prod['stock'] == 10

    # Test successful sale of 3 units
    success_sale = client.post('/api/sales', json={
        'customer_name': 'Test Customer Verified',
        'customer_phone': '9988776655',
        'items': [{'product_id': prod_id, 'quantity': 3, 'unit_price': 500.00}]
    }, headers={'Authorization': f'Bearer {admin_token}'})
    assert success_sale.status_code == 201
    sale_id = success_sale.get_json()['sale_id']

    # Verify stock was decremented to 7
    check_prod2 = client.get(f'/api/products/{prod_id}', headers={'Authorization': f'Bearer {admin_token}'}).get_json()['data']
    assert check_prod2['stock'] == 7

    # Verify sale invoice
    bill_res = client.get(f'/api/sales/{sale_id}', headers={'Authorization': f'Bearer {admin_token}'})
    assert bill_res.status_code == 200
    bill_data = bill_res.get_json()['data']
    assert bill_data['sale']['total_amount'] == 1500.00
    assert len(bill_data['items']) == 1

def test_expenses_and_budgets(client, admin_token):
    # List categories
    cat_res = client.get('/api/expenses/categories', headers={'Authorization': f'Bearer {admin_token}'})
    assert cat_res.status_code == 200
    cats = cat_res.get_json()['data']
    assert len(cats) > 0
    first_cat = cats[0]

    # Add expense
    add_res = client.post('/api/expenses', json={
        'category_id': first_cat['id'],
        'title': 'Test Office Cleaning',
        'amount': 450.00,
        'expense_date': '2026-11-06',
        'note': 'Cleaned floors and glass'
    }, headers={'Authorization': f'Bearer {admin_token}'})
    assert add_res.status_code == 201

    # Analytics
    ana_res = client.get('/api/expenses/analytics', headers={'Authorization': f'Bearer {admin_token}'})
    assert ana_res.status_code == 200
    assert 'bar_chart' in ana_res.get_json()

@pytest.mark.parametrize("endpoint,filename", [
    ('/api/export/products', 'products_export.xlsx'),
    ('/api/export/customers', 'customers_export.xlsx'),
    ('/api/export/sales', 'sales_export.xlsx'),
    ('/api/export/sale-items', 'sale_items_export.xlsx'),
    ('/api/export/expenses', 'expenses_export.xlsx'),
    ('/api/export/users', 'users_export.xlsx'),
    ('/api/export/stock', 'stock_export.xlsx'),
    ('/api/export/categories', 'product_categories_export.xlsx'),
    ('/api/export/brands', 'product_brands_export.xlsx'),
    ('/api/export/expense-categories', 'expense_categories_export.xlsx'),
    ('/api/export/budgets', 'budgets_export.xlsx'),
    ('/api/export/daily-report', 'daily_report_'),
    ('/api/export/monthly-report', 'monthly_report_'),
])
def test_all_excel_exports(client, admin_token, endpoint, filename):
    res = client.get(endpoint, headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert res.content_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert filename in res.headers.get("Content-Disposition", "")

    # Verify that openpyxl can load and parse the generated Excel file without errors
    excel_file = io.BytesIO(res.data)
    wb = load_workbook(excel_file)
    assert len(wb.sheetnames) > 0
    ws = wb.active
    # Header title check
    assert ws.cell(row=1, column=1).value is not None

def test_empty_records_excel_export(client, admin_token):
    res = client.get('/api/export/products?search=NONEXISTENT_ITEM_XYZ12345', headers={'Authorization': f'Bearer {admin_token}'})
    assert res.status_code == 200
    assert res.content_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    wb = load_workbook(io.BytesIO(res.data))
    ws = wb.active
    assert ws.cell(row=4, column=1).value == "Product ID"
    assert "No records found" in str(ws.cell(row=5, column=1).value)

