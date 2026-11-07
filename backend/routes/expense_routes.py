from datetime import datetime
from flask import Blueprint, request, jsonify
from database import get_db, query_db, execute_db
from auth_utils import login_required, admin_required

expense_bp = Blueprint('expenses', __name__)

def compute_reaction(spent, budget):
    if budget <= 0:
        return {'emoji': '❓', 'label': 'No Budget Set', 'color': '#95a5a6', 'class': 'neutral', 'percent': 0}
    pct = round((spent / budget) * 100)
    if pct <= 80:
        return {'emoji': '😊', 'label': 'Good', 'color': '#27ae60', 'class': 'good', 'percent': pct}
    elif pct <= 100:
        return {'emoji': '😐', 'label': 'Warning', 'color': '#f39c12', 'class': 'warn', 'percent': pct}
    else:
        return {'emoji': '😟', 'label': 'Overspent', 'color': '#e74c3c', 'class': 'bad', 'percent': pct}

@expense_bp.route('', methods=['GET'])
@login_required
def list_expenses():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    search = request.args.get('search', '').strip()
    category_id = request.args.get('category_id')

    sql = """
        SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.budget as category_budget
        FROM expenses e
        JOIN expense_categories ec ON e.category_id = ec.id
        WHERE DATE_FORMAT(e.expense_date, '%Y-%m') = ?
    """
    params = [month]

    if category_id:
        sql += " AND e.category_id = ?"
        params.append(int(category_id))

    if search:
        search_like = f"%{search}%"
        sql += " AND (e.title LIKE ? OR ec.name LIKE ? OR e.note LIKE ?)"
        params.extend([search_like, search_like, search_like])

    sql += " ORDER BY e.expense_date DESC, e.id DESC"
    expenses = query_db(sql, params)

    # Attach reactions to individual expenses
    for ex in expenses:
        ex['reaction'] = compute_reaction(ex['amount'], ex['category_budget'])

    # Category totals for this month
    cat_totals = query_db("""
        SELECT ec.id, ec.name, ec.icon, ec.budget,
               COALESCE(SUM(e.amount), 0) as total_spent
        FROM expense_categories ec
        LEFT JOIN expenses e ON e.category_id = ec.id AND DATE_FORMAT(e.expense_date, '%Y-%m') = ?
        GROUP BY ec.id
        ORDER BY total_spent DESC, ec.name ASC
    """, (month,))

    for ct in cat_totals:
        ct['reaction'] = compute_reaction(ct['total_spent'], ct['budget'])

    grand_total = sum(ex['amount'] for ex in expenses)
    total_budget = sum(ct['budget'] for ct in cat_totals)
    overall_reaction = compute_reaction(grand_total, total_budget)
    remaining_budget = max(0.0, total_budget - grand_total)
    budget_used_pct = min(100, round((grand_total / total_budget) * 100)) if total_budget > 0 else 0

    return jsonify({
        'success': True,
        'month': month,
        'expenses': expenses,
        'category_totals': cat_totals,
        'summary': {
            'grand_total': grand_total,
            'total_budget': total_budget,
            'remaining_budget': remaining_budget,
            'budget_used_percent': budget_used_pct,
            'entries_count': len(expenses),
            'overall_reaction': overall_reaction
        }
    })

@expense_bp.route('', methods=['POST'])
@login_required
def add_expense():
    data = request.get_json(silent=True) or request.form.to_dict()
    category_id = data.get('category_id')
    title = (data.get('title') or '').strip()
    note = (data.get('note') or '').strip()
    expense_date = data.get('expense_date', datetime.now().strftime('%Y-%m-%d'))

    try:
        amount = float(data.get('amount', 0))
        cat_id = int(category_id)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Category and Amount must be valid.'}), 400

    if not title:
        return jsonify({'success': False, 'message': 'Expense title is required.'}), 400
    if amount <= 0:
        return jsonify({'success': False, 'message': 'Amount must be greater than zero.'}), 400

    # Check category existence
    cat = query_db("SELECT id FROM expense_categories WHERE id = ?", (cat_id,), one=True)
    if not cat:
        return jsonify({'success': False, 'message': 'Selected category does not exist.'}), 404

    res = execute_db("""
        INSERT INTO expenses (category_id, title, amount, note, expense_date)
        VALUES (?, ?, ?, ?, ?)
    """, (cat_id, title, amount, note, expense_date))

    return jsonify({
        'success': True,
        'message': 'Expense recorded successfully!',
        'id': res['lastrowid']
    }), 201

@expense_bp.route('/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    res = execute_db("DELETE FROM expenses WHERE id = ?", (expense_id,))
    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'Expense not found.'}), 404
    return jsonify({'success': True, 'message': 'Expense deleted successfully.'})

# --- Category and Budget Management ---
@expense_bp.route('/categories', methods=['GET'])
@login_required
def list_expense_categories():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    categories = query_db("""
        SELECT ec.*, 
               COALESCE(SUM(e.amount), 0) as spent_this_month,
               COUNT(e.id) as expense_count
        FROM expense_categories ec
        LEFT JOIN expenses e ON ec.id = e.category_id AND DATE_FORMAT(e.expense_date, '%Y-%m') = ?
        GROUP BY ec.id
        ORDER BY ec.name ASC
    """, (month,))

    for c in categories:
        c['reaction'] = compute_reaction(c['spent_this_month'], c['budget'])

    return jsonify({'success': True, 'data': categories})

@expense_bp.route('/categories', methods=['POST'])
@admin_required
def create_expense_category():
    data = request.get_json(silent=True) or request.form.to_dict()
    name = (data.get('name') or '').strip()
    icon = (data.get('icon') or '💰').strip()
    try:
        budget = float(data.get('budget', 0.0))
    except (ValueError, TypeError):
        budget = 0.0

    if not name:
        return jsonify({'success': False, 'message': 'Category name is required.'}), 400

    res = execute_db("""
        INSERT INTO expense_categories (name, icon, budget) VALUES (?, ?, ?)
    """, (name, icon, budget))

    return jsonify({'success': True, 'message': 'Expense category created.', 'id': res['lastrowid']}), 201

@expense_bp.route('/categories/<int:cat_id>', methods=['PUT'])
@admin_required
def update_expense_category(cat_id):
    data = request.get_json(silent=True) or request.form.to_dict()
    name = (data.get('name') or '').strip()
    icon = (data.get('icon') or '💰').strip()
    try:
        budget = float(data.get('budget', 0.0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Budget must be a valid number.'}), 400

    if not name:
        return jsonify({'success': False, 'message': 'Category name is required.'}), 400

    res = execute_db("""
        UPDATE expense_categories SET name = ?, icon = ?, budget = ? WHERE id = ?
    """, (name, icon, budget, cat_id))

    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'Category not found.'}), 404

    return jsonify({'success': True, 'message': 'Expense category updated successfully.'})

@expense_bp.route('/categories/<int:cat_id>', methods=['DELETE'])
@admin_required
def delete_expense_category(cat_id):
    res = execute_db("DELETE FROM expense_categories WHERE id = ?", (cat_id,))
    if res['rowcount'] == 0:
        return jsonify({'success': False, 'message': 'Category not found.'}), 404
    return jsonify({'success': True, 'message': 'Expense category deleted successfully.'})

@expense_bp.route('/analytics', methods=['GET'])
@login_required
def expense_analytics():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    cat_totals = query_db("""
        SELECT ec.id, ec.name, ec.icon, ec.budget,
               COALESCE(SUM(e.amount), 0) as total_spent
        FROM expense_categories ec
        LEFT JOIN expenses e ON e.category_id = ec.id AND DATE_FORMAT(e.expense_date, '%Y-%m') = ?
        GROUP BY ec.id
        ORDER BY total_spent DESC
    """, (month,))

    chart_labels = []
    chart_spent = []
    chart_budget = []
    chart_colors = []

    for ct in cat_totals:
        r = compute_reaction(ct['total_spent'], ct['budget'])
        chart_labels.append(f"{ct['icon']} {ct['name']}")
        chart_spent.append(float(ct['total_spent']))
        chart_budget.append(float(ct['budget']))
        chart_colors.append(r['color'])

    # Non-zero items for doughnut chart
    doughnut_labels = []
    doughnut_data = []
    doughnut_colors = []
    for ct, col in zip(cat_totals, chart_colors):
        if ct['total_spent'] > 0:
            doughnut_labels.append(f"{ct['icon']} {ct['name']}")
            doughnut_data.append(float(ct['total_spent']))
            doughnut_colors.append(col)

    return jsonify({
        'success': True,
        'month': month,
        'bar_chart': {
            'labels': chart_labels,
            'spent': chart_spent,
            'budgets': chart_budget,
            'colors': chart_colors
        },
        'doughnut_chart': {
            'labels': doughnut_labels,
            'data': doughnut_data,
            'colors': doughnut_colors
        }
    })
