import io
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Common style constants
HEADER_FILL = PatternFill(start_color="2C3E50", end_color="2C3E50", fill_type="solid")
HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
TITLE_FONT = Font(name="Calibri", size=16, bold=True, color="2C3E50")
SUBTITLE_FONT = Font(name="Calibri", size=10, italic=True, color="7F8C8D")
TOTAL_FONT = Font(name="Calibri", size=11, bold=True, color="000000")
TOTAL_FILL = PatternFill(start_color="EAEDED", end_color="EAEDED", fill_type="solid")

THIN_BORDER_SIDE = Side(border_style="thin", color="BDC3C7")
THIN_BORDER = Border(
    left=THIN_BORDER_SIDE,
    right=THIN_BORDER_SIDE,
    top=THIN_BORDER_SIDE,
    bottom=THIN_BORDER_SIDE
)
DOUBLE_BOTTOM_BORDER = Border(
    left=THIN_BORDER_SIDE,
    right=THIN_BORDER_SIDE,
    top=THIN_BORDER_SIDE,
    bottom=Side(border_style="double", color="2C3E50")
)

ALIGN_LEFT = Alignment(horizontal="left", vertical="center")
ALIGN_CENTER = Alignment(horizontal="center", vertical="center")
ALIGN_RIGHT = Alignment(horizontal="right", vertical="center")

def build_excel_workbook(
    title,
    columns,
    rows,
    total_columns=None,
    filter_description=None
):
    """
    Builds a professionally styled Excel workbook.
    
    :param title: Title displayed on sheet header (e.g., 'Product Inventory Report')
    :param columns: List of dicts, e.g. [
        {'header': 'Product Name', 'key': 'name', 'align': 'left', 'format': 'text'},
        {'header': 'Price (₹)', 'key': 'price', 'align': 'right', 'format': 'currency'},
        {'header': 'Stock', 'key': 'stock', 'align': 'right', 'format': 'number'},
        {'header': 'Date', 'key': 'created_at', 'align': 'center', 'format': 'date'}
    ]
    :param rows: List of dictionaries matching the keys in columns
    :param total_columns: Optional dict of columns to sum, e.g. {'price': 'sum', 'stock': 'sum'}
    :param filter_description: Optional string describing active filters (e.g., 'Filter: Category=mens')
    :return: BytesIO buffer containing the .xlsx workbook
    """
    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]  # Excel worksheet title max 31 characters
    ws.views.sheetView[0].showGridLines = True

    current_row = 1

    # 1. Title Banner
    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=len(columns))
    title_cell = ws.cell(row=current_row, column=1, value=f"Retail Shop — {title}")
    title_cell.font = TITLE_FONT
    title_cell.alignment = ALIGN_LEFT
    ws.row_dimensions[current_row].height = 28
    current_row += 1

    # 2. Metadata / Subtitle
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    subtitle_text = f"Generated on: {generated_at}"
    if filter_description:
        subtitle_text += f" | {filter_description}"
    subtitle_text += f" | Total Records: {len(rows)}"

    ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=len(columns))
    sub_cell = ws.cell(row=current_row, column=1, value=subtitle_text)
    sub_cell.font = SUBTITLE_FONT
    sub_cell.alignment = ALIGN_LEFT
    ws.row_dimensions[current_row].height = 18
    current_row += 1

    # Blank row
    current_row += 1

    # 3. Table Column Headers
    header_row_idx = current_row
    ws.row_dimensions[header_row_idx].height = 24

    for col_idx, col in enumerate(columns, start=1):
        cell = ws.cell(row=header_row_idx, column=col_idx, value=col['header'])
        cell.font = HEADER_FONT
        cell.fill = HEADER_FILL
        cell.alignment = ALIGN_CENTER if col.get('align') == 'center' else (ALIGN_RIGHT if col.get('align') == 'right' else ALIGN_LEFT)
        cell.border = THIN_BORDER

    current_row += 1

    # 4. Table Data Rows
    if not rows:
        # Handle empty records gracefully
        ws.merge_cells(start_row=current_row, start_column=1, end_row=current_row, end_column=len(columns))
        empty_cell = ws.cell(row=current_row, column=1, value="No records found.")
        empty_cell.font = Font(name="Calibri", size=11, italic=True, color="7F8C8D")
        empty_cell.alignment = ALIGN_CENTER
        empty_cell.border = THIN_BORDER
        ws.row_dimensions[current_row].height = 22
        current_row += 1
    else:
        totals = {col['key']: 0.0 for col in columns if total_columns and col['key'] in total_columns}

        for r_idx, row_data in enumerate(rows):
            ws.row_dimensions[current_row].height = 20
            # Alternate row background slightly for readability
            row_fill = PatternFill(start_color="F9FAFB", end_color="F9FAFB", fill_type="solid") if r_idx % 2 == 1 else None

            for col_idx, col in enumerate(columns, start=1):
                key = col['key']
                val = row_data.get(key)
                fmt = col.get('format', 'text')
                cell = ws.cell(row=current_row, column=col_idx)

                # Set alignment
                if col.get('align') == 'center':
                    cell.alignment = ALIGN_CENTER
                elif col.get('align') == 'right':
                    cell.alignment = ALIGN_RIGHT
                else:
                    cell.alignment = ALIGN_LEFT

                if row_fill:
                    cell.fill = row_fill
                cell.border = THIN_BORDER

                # Formatting and values
                if val is None:
                    cell.value = "-"
                elif fmt == 'currency':
                    try:
                        num_val = float(val)
                        cell.value = num_val
                        cell.number_format = '"₹"#,##0.00'
                        if key in totals:
                            totals[key] += num_val
                    except (ValueError, TypeError):
                        cell.value = str(val)
                elif fmt == 'number':
                    try:
                        num_val = float(val) if '.' in str(val) else int(val)
                        cell.value = num_val
                        cell.number_format = '#,##0'
                        if key in totals:
                            totals[key] += num_val
                    except (ValueError, TypeError):
                        cell.value = str(val)
                elif fmt == 'date':
                    # Parse date if string
                    if isinstance(val, str):
                        clean_date = val.replace('T', ' ')
                        cell.value = clean_date
                    else:
                        cell.value = str(val)
                else:
                    cell.value = str(val)

            current_row += 1

        # 5. Totals Row if requested
        if total_columns and totals:
            ws.row_dimensions[current_row].height = 24
            for col_idx, col in enumerate(columns, start=1):
                key = col['key']
                cell = ws.cell(row=current_row, column=col_idx)
                cell.font = TOTAL_FONT
                cell.fill = TOTAL_FILL
                cell.border = DOUBLE_BOTTOM_BORDER

                if col_idx == 1:
                    cell.value = "Grand Total"
                    cell.alignment = ALIGN_LEFT
                elif key in totals:
                    cell.value = totals[key]
                    fmt = col.get('format', 'text')
                    if fmt == 'currency':
                        cell.number_format = '"₹"#,##0.00'
                    elif fmt == 'number':
                        cell.number_format = '#,##0'
                    cell.alignment = ALIGN_RIGHT
                else:
                    cell.value = ""

            current_row += 1

    # 6. Auto-fit column widths
    for col_idx, col in enumerate(columns, start=1):
        col_letter = get_column_letter(col_idx)
        # Determine maximum width based on header length and content sample
        header_len = len(str(col['header']))
        max_len = header_len
        for row in ws.iter_rows(min_row=header_row_idx, max_row=current_row, min_col=col_idx, max_col=col_idx):
            val = row[0].value
            if val is not None:
                val_str = str(val)
                if len(val_str) > max_len and len(val_str) < 60:
                    max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # Save to BytesIO
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
