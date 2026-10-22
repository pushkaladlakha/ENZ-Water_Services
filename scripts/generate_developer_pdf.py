#!/usr/bin/env python3
"""
Taumata Arowai GIS Platform - Backend Developer Manual & VS Code API Calling Guide
Generates an exhaustive, publication-grade printable PDF developer manual using ReportLab.
"""

import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and stamp total page count in running footer."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        if self._pageNumber > 1:
            # Running Header
            self.drawString(54, letter[1] - 36, "Taumata Arowai GIS Platform — Backend Developer Manual & VS Code API Guide")
            self.drawRightString(letter[0] - 54, letter[1] - 36, "Te Mana o te Wai | Water Services Act 2021")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

            # Running Footer
            self.line(54, 45, letter[0] - 54, 45)
            self.drawString(54, 32, "Confidential — Internal Developer & Systems Integration Manual")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(letter[0] - 54, 32, page_text)

        self.restoreState()

def build_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    NAVY = colors.HexColor("#1E3A8A")
    CYAN = colors.HexColor("#0284C7")
    DARK = colors.HexColor("#0F172A")
    MUTED = colors.HexColor("#475569")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BG_CODE = colors.HexColor("#0F172A")
    BORDER = colors.HexColor("#CBD5E1")
    SUCCESS = colors.HexColor("#16A34A")
    WARNING = colors.HexColor("#D97706")
    DANGER = colors.HexColor("#DC2626")

    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=22, leading=27,
        textColor=NAVY, spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle', parent=styles['Normal'],
        fontName='Helvetica', fontSize=10.5, leading=15,
        textColor=MUTED, spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1Custom', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=14, leading=18,
        textColor=NAVY, spaceBefore=12, spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=11, leading=15,
        textColor=CYAN, spaceBefore=9, spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3Custom', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9.5, leading=13,
        textColor=DARK, spaceBefore=6, spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyCustom', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=DARK, spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletCustom', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8, leading=11.5,
        textColor=DARK, leftIndent=12, spaceAfter=2.5
    )

    callout_style = ParagraphStyle(
        'CalloutText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8, leading=11,
        textColor=DARK
    )

    code_style = ParagraphStyle(
        'CodeSnippet', parent=styles['Normal'],
        fontName='Courier', fontSize=7, leading=9.5,
        textColor=colors.HexColor("#E2E8F0")
    )

    table_header_style = ParagraphStyle(
        'TableHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8, leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell', parent=styles['Normal'],
        fontName='Helvetica', fontSize=7.5, leading=10,
        textColor=DARK
    )

    table_code_style = ParagraphStyle(
        'TableCode', parent=styles['Normal'],
        fontName='Courier', fontSize=7, leading=9,
        textColor=colors.HexColor("#0284C7")
    )

    def make_callout(text: str, title: str = "PRO-TIP", bg_color=BG_LIGHT, border_color=CYAN):
        content = [Paragraph(f"<b>{title}:</b> {text}", callout_style)]
        t = Table([[content]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 1, border_color),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        return t

    def make_code_box(code_text: str):
        lines = code_text.strip().split("\n")
        para_content = "<br/>".join([line.replace(" ", "&nbsp;").replace("<", "&lt;").replace(">", "&gt;") for line in lines])
        p = Paragraph(para_content, code_style)
        t = Table([[p]], colWidths=[504])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_CODE),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#334155")),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        return t

    def add_endpoint(title, method, path, rbac, description, req_snippet, resp_snippet):
        badge_color = "#16A34A" if method == "GET" else ("#2563EB" if method == "POST" else ("#D97706" if method == "PATCH" else "#DC2626"))
        header_p = Paragraph(
            f"<b><font color='{badge_color}'>[{method}]</font> {path}</b> — <i>{title}</i> (RBAC: <b>{rbac}</b>)",
            h3_style
        )
        desc_p = Paragraph(description, body_style)
        
        req_lines = req_snippet.strip().split("\n")
        req_fmt = "<br/>".join([l.replace(" ", "&nbsp;").replace("<", "&lt;").replace(">", "&gt;") for l in req_lines])
        req_p = Paragraph(f"<b>VS Code Request:</b><br/>{req_fmt}", code_style)

        resp_lines = resp_snippet.strip().split("\n")
        resp_fmt = "<br/>".join([l.replace(" ", "&nbsp;").replace("<", "&lt;").replace(">", "&gt;") for l in resp_lines])
        resp_p = Paragraph(f"<b>Response JSON (200 OK / 201 Created):</b><br/>{resp_fmt}", code_style)
        
        box_table = Table([[req_p], [resp_p]], colWidths=[504])
        box_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BG_CODE),
            ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor("#334155")),
            ('PADDING', (0, 0), (-1, -1), 4.5),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#1E293B")),
        ]))
        
        return [KeepTogether([header_p, desc_p, box_table]), Spacer(1, 6)]

    story = []

    # =========================================================================
    # COVER / HEADER
    # =========================================================================
    top_table_data = [
        [
            Paragraph("<b>TAUMATA AROWAI GIS PLATFORM</b>", ParagraphStyle('H0', fontName='Helvetica-Bold', fontSize=10, textColor=CYAN)),
            Paragraph("<b>VERSION 1.0.0 — OCTOBER 2026</b>", ParagraphStyle('H0R', fontName='Helvetica-Bold', fontSize=9, textColor=MUTED, alignment=2))
        ]
    ]
    t_top = Table(top_table_data, colWidths=[300, 204])
    t_top.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('PADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(t_top)
    story.append(HRFlowable(width="100%", thickness=1.5, color=NAVY, spaceAfter=12))

    story.append(Paragraph("Backend Developer Manual & VS Code API Calling Guide", title_style))
    story.append(Paragraph(
        "A definitive engineering handbook covering Clean Architecture backend customization, "
        "Python / FastAPI service extension, and comprehensive API execution workflows completely within Visual Studio Code.",
        subtitle_style
    ))

    # Metadata card
    meta_data = [
        [
            Paragraph("<b>Target Audience:</b> Full-Stack Engineers, GIS Developers, API Testers", table_cell_style),
            Paragraph("<b>Core Framework:</b> FastAPI + Shapely 2.0 + SQLAlchemy 2.0", table_cell_style),
        ],
        [
            Paragraph("<b>Spatial Reference:</b> NZTM2000 (EPSG:2193) & WGS84 (EPSG:4326)", table_cell_style),
            Paragraph("<b>Test Suite:</b> 34 Automated Pytest Specifications", table_cell_style),
        ],
        [
            Paragraph("<b>Zero-Config Database:</b> Standalone SQLite spatial (water_services.db)", table_cell_style),
            Paragraph("<b>VS Code Tools:</b> REST Client, Launch Debugger, Tasks, Simple Browser", table_cell_style),
        ]
    ]
    t_meta = Table(meta_data, colWidths=[252, 252])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 1: VS CODE ENVIRONMENT SETUP
    # =========================================================================
    story.append(Paragraph("1. VS Code Developer Workspace Setup", h1_style))
    story.append(Paragraph(
        "Visual Studio Code is the designated development environment for the Taumata Arowai GIS Platform. "
        "With preconfigured workspace configurations located in <code>.vscode/</code>, developers can debug, test, and invoke all "
        "system components without requiring external software (e.g. Postman or standalone terminals).",
        body_style
    ))

    story.append(Paragraph("Recommended VS Code Extensions", h2_style))
    story.append(Paragraph("Install these extensions from the VS Code Marketplace (<code>Ctrl+Shift+X</code> / <code>Cmd+Shift+X</code>):", body_style))
    story.append(Paragraph("• <b>REST Client</b> (<code>humao.rest-client</code>): Execute runnable <code>.http</code> test files with 1-click 'Send Request'.", bullet_style))
    story.append(Paragraph("• <b>Python & Pylance</b> (<code>ms-python.python</code>): Provides rich IntelliSense, linting, and type checking.", bullet_style))
    story.append(Paragraph("• <b>Python Debugger</b> (<code>ms-python.debugpy</code>): Enables F5 breakpoint debugging for FastAPI and Pytest.", bullet_style))
    story.append(Paragraph("• <b>SQLite Viewer</b> (<code>qwtel.sqlite-viewer</code>): Inspect <code>water_services.db</code> tables and geometries directly in VS Code.", bullet_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("One-Click F5 Debugging: <code>.vscode/launch.json</code>", h2_style))
    story.append(Paragraph(
        "Pressing <b>F5</b> in VS Code launches the FastAPI backend in interactive debug mode with live hot-reloading. "
        "Breakpoints placed anywhere in controllers, spatial math algorithms, or repositories pause execution cleanly.",
        body_style
    ))

    sample_launch = """// .vscode/launch.json (Included in workspace)
{
  "name": "FastAPI: Run & Debug Backend (Port 8000)",
  "type": "debugpy",
  "request": "launch",
  "module": "uvicorn",
  "args": ["backend.app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
  "env": { "PYTHONPATH": "${workspaceFolder}" },
  "console": "integratedTerminal"
}"""
    story.append(make_code_box(sample_launch))
    story.append(Spacer(1, 6))

    story.append(make_callout(
        "You can switch between launching the FastAPI server, running the Pytest suite, or re-seeding the SQLite spatial database "
        "by selecting the target from the <b>Run & Debug</b> drop-down menu in the VS Code sidebar (<code>Ctrl+Shift+D</code>).",
        "DEBUGGER WORKFLOW"
    ))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: HOW TO EDIT & EXTEND THE BACKEND
    # =========================================================================
    story.append(Paragraph("2. Different Ways to Edit & Extend the Backend", h1_style))
    story.append(Paragraph(
        "The backend strictly adheres to Clean Architecture. System responsibilities are separated into distinct layers. "
        "Below are the primary workflows for modifying or extending the system:",
        body_style
    ))

    arch_table_data = [
        [Paragraph("Layer", table_header_style), Paragraph("Directory Location", table_header_style), Paragraph("Primary Responsibility", table_header_style)],
        [Paragraph("<b>API Routes</b>", table_cell_style), Paragraph("<code>backend/app/api/routes/</code>", table_code_style), Paragraph("HTTP verbs, routing, query unpacking, auth dependencies", table_cell_style)],
        [Paragraph("<b>Schemas (DTOs)</b>", table_cell_style), Paragraph("<code>backend/app/schemas/</code>", table_code_style), Paragraph("Pydantic v2 validation models, request/response contracts", table_cell_style)],
        [Paragraph("<b>Domain Services</b>", table_cell_style), Paragraph("<code>backend/app/services/</code>", table_code_style), Paragraph("Core business logic, 7-step engine, LINZ NZTM projection", table_cell_style)],
        [Paragraph("<b>Repositories</b>", table_cell_style), Paragraph("<code>backend/app/repositories/</code>", table_code_style), Paragraph("SQLAlchemy 2.0 queries, caching, data access isolation", table_cell_style)],
        [Paragraph("<b>Database Models</b>", table_cell_style), Paragraph("<code>backend/app/db/models/</code>", table_code_style), Paragraph("Declarative table definitions matching database schema", table_cell_style)],
    ]
    t_arch = Table(arch_table_data, colWidths=[90, 160, 254])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Way 1: Adding a New API Endpoint", h2_style))
    story.append(Paragraph(
        "1. Open or create a route file in <code>backend/app/api/routes/</code>.<br/>"
        "2. Define the route handler with Pydantic request/response schemas and dependencies.<br/>"
        "3. Register the router in <code>backend/app/api/router.py</code> so it mounts under <code>/api/v1</code> and <code>/api</code>.",
        body_style
    ))

    sample_route = """# backend/app/api/routes/water_quality.py
from fastapi import APIRouter, Depends
from backend.app.services.auth_service import require_official_or_admin

router = APIRouter(prefix="/water-quality", tags=["Water Quality Telemetry"])

@router.get("/compliance-summary")
def get_compliance_summary(user = Depends(require_official_or_admin)):
    return {"total_schemes": 45, "compliant_pct": 98.4, "status": "Taumata Arowai Compliant"}"""
    story.append(make_code_box(sample_route))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Way 2: Modifying Spatial Logic or Projections", h2_style))
    story.append(Paragraph(
        "All coordinate projection calculations and GEOS polygon operations live in <code>backend/app/services/spatial_service.py</code>. "
        "The LINZ NZTM2000 Transverse Mercator formula converts GPS WGS84 decimal degrees (EPSG:4326) into metric coordinates (EPSG:2193) "
        "allowing millimeter-accurate distance buffer checks without Mercator latitude distortion.",
        body_style
    ))

    sample_spatial = """# Example: Custom spatial buffer evaluation in spatial_service.py
from shapely.geometry import Point, shape

def check_point_in_zone(lat: float, lng: float, zone_polygon_geojson: dict) -> bool:
    pt = Point(lng, lat)  # [x=lng, y=lat] in WGS84
    poly = shape(zone_polygon_geojson)
    return poly.contains(pt)"""
    story.append(make_code_box(sample_spatial))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Way 3: Updating Seed Data & Adding Network Assets", h2_style))
    story.append(Paragraph(
        "To modify mock pipelines, valves, or test user accounts, edit <code>backend/app/db/seed.py</code>. "
        "Execute the seeding script at any time without leaving VS Code by pressing <code>Ctrl+Shift+P</code> &rarr; "
        "<b>Tasks: Run Task</b> &rarr; <b>Re-Seed Spatial SQLite DB</b>.",
        body_style
    ))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 3: CALLING APIS USING VS CODE ONLY
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("3. Calling All Backend APIs Using VS Code ONLY", h1_style))
    story.append(Paragraph(
        "You do NOT need external software (like Postman or Insomnia) to test the platform. "
        "VS Code provides four native, highly productive mechanisms to execute and inspect the APIs:",
        body_style
    ))

    method_cards = [
        [
            Paragraph("<b>METHOD A: REST Client Extension (.http)</b><br/>"
                      "<b>The Pro Standard:</b> Open <code>backend/backend_api.http</code> in VS Code. "
                      "Click the clickable <code>Send Request</code> text directly above any endpoint. "
                      "Response headers and JSON body render instantly in a split tab. "
                      "Supports dynamic variables and JWT token chaining across requests.", table_cell_style),
            Paragraph("<b>METHOD B: VS Code Simple Browser (Swagger UI)</b><br/>"
                      "<b>Interactive Visual UI:</b> Press <code>Ctrl+Shift+P</code> &rarr; Type <code>Simple Browser: Show</code> &rarr; "
                      "Enter <code>http://127.0.0.1:8000/docs</code>.<br/>"
                      "The full interactive FastAPI Swagger documentation opens directly inside a VS Code editor tab with 'Try it out' buttons.", table_cell_style),
        ],
        [
            Paragraph("<b>METHOD C: VS Code Integrated Terminal (curl)</b><br/>"
                      "<b>Fast Command-Line:</b> Open the integrated terminal (<code>Ctrl+~</code>). "
                      "Execute standard <code>curl</code> commands formatted with JSON output piped to <code>jq</code> or python.<br/>"
                      "Works across PowerShell, zsh, and bash.", table_cell_style),
            Paragraph("<b>METHOD D: Thunder Client Extension</b><br/>"
                      "<b>Sidebar GUI:</b> Install the Thunder Client extension. "
                      "Provides a GUI collection runner directly in the VS Code Activity Bar for organizing environments and test suites.", table_cell_style),
        ]
    ]
    t_methods = Table(method_cards, colWidths=[252, 252])
    t_methods.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_methods)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Dynamic Token Chaining in <code>backend_api.http</code>", h2_style))
    story.append(Paragraph(
        "In <code>backend/backend_api.http</code>, tokens from authentication requests are automatically stored in variables "
        "and injected into subsequent requests using standard REST Client syntax:",
        body_style
    ))

    sample_chaining = """# 1. Login as Authorized Official
# @name officialLogin
POST http://127.0.0.1:8000/api/v1/auth/login
Content-Type: application/json

{"email": "official@taumataarowai.govt.nz", "password": "OfficialWater#2026"}

###
# 2. Extract Token Automatically
@token = {{officialLogin.response.body.accessToken}}

###
# 3. Call Protected Inspection API with Injected Bearer Token
GET http://127.0.0.1:8000/api/v1/assets?category=reticulation_main
Authorization: Bearer {{token}}"""
    story.append(make_code_box(sample_chaining))
    story.append(Spacer(1, 10))

    # Preconfigured test accounts table
    story.append(Paragraph("Preconfigured Test Accounts for VS Code Testing", h2_style))
    test_creds_data = [
        [Paragraph("Role", table_header_style), Paragraph("Email Address", table_header_style), Paragraph("Password", table_header_style), Paragraph("Assigned Capabilities", table_header_style)],
        [Paragraph("<b>Citizen</b>", table_cell_style), Paragraph("citizen@nzwater.org.nz", table_code_style), Paragraph("CitizenNZ#2026", table_code_style), Paragraph("Public schemes, grades, incident reporting intake", table_cell_style)],
        [Paragraph("<b>Official</b>", table_cell_style), Paragraph("official@taumataarowai.govt.nz", table_code_style), Paragraph("OfficialWater#2026", table_code_style), Paragraph("Unredacted CCTV, invert depth, incident investigation updates", table_cell_style)],
        [Paragraph("<b>Admin</b>", table_cell_style), Paragraph("admin@taumataarowai.govt.nz", table_code_style), Paragraph("ArowaiAdmin#2026", table_code_style), Paragraph("Full system governance, audit logs, spatial re-seeding", table_cell_style)],
    ]
    t_creds = Table(test_creds_data, colWidths=[65, 155, 110, 174])
    t_creds.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
    ]))
    story.append(t_creds)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 4: COMPLETE API CALL CATALOG
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("4. Complete API Request & Response Reference", h1_style))
    story.append(Paragraph(
        "Below is the complete reference of all 18 backend endpoints with exact verbs, URLs, payloads, and expected JSON structures.",
        body_style
    ))

    # 4.1 Health Check
    for item in add_endpoint(
        "System Uptime Health Probe", "GET", "/api/health", "Public",
        "Verifies that the FastAPI process is active and responsive.",
        "GET http://127.0.0.1:8000/api/health",
        '{"status": "healthy", "service": "Taumata Arowai GIS Platform API", "version": "1.0.0"}'
    ): story.append(item)

    # 4.2 Readiness Check
    for item in add_endpoint(
        "Database & GEOS Readiness Check", "GET", "/api/ready", "Public",
        "Verifies database connectivity and Shapely GEOS spatial engine initialization.",
        "GET http://127.0.0.1:8000/api/ready",
        '{"status": "ready", "database": "connected", "spatial_engine": "shapely_geos"}'
    ): story.append(item)

    # 4.3 Auth Login
    for item in add_endpoint(
        "User Login & JWT Token Issuance", "POST", "/api/v1/auth/login", "Public",
        "Authenticates Citizen, Official, or Admin credentials and returns a signed HS256 JWT.",
        'POST http://127.0.0.1:8000/api/v1/auth/login\nContent-Type: application/json\n\n{"email": "official@taumataarowai.govt.nz", "password": "OfficialWater#2026"}',
        '{"accessToken": "eyJhbGciOi...", "tokenType": "bearer", "role": "official", "user": {"email": "official@...", "role": "official"}}'
    ): story.append(item)

    # 4.4 Auth Me
    for item in add_endpoint(
        "Current User Profile", "GET", "/api/v1/auth/me", "Authenticated",
        "Retrieves the currently authenticated user's profile, job title, and organization.",
        "GET http://127.0.0.1:8000/api/v1/auth/me\nAuthorization: Bearer {{officialToken}}",
        '{"id": "usr-official-001", "name": "Aroha Henare", "role": "official", "organization": "Taumata Arowai - National Regulator"}'
    ): story.append(item)

    # 4.5 Cadastral Address Search
    for item in add_endpoint(
        "LINZ Cadastral Address Search", "GET", "/api/v1/addresses/search?q={query}&limit=5", "Public",
        "Searches registered LINZ parcels and street addresses matching the query string.",
        "GET http://127.0.0.1:8000/api/v1/addresses/search?q=Great%20North%20Road&limit=2",
        '{"query": "Great North Road", "count": 2, "results": [{"id": "PARCEL-4015-GNR", "fullAddress": "4015 Great North Road, Kelston...", "areaM2": 812.0}]}'
    ): story.append(item)

    # 4.6 Parcel Feature by ID
    for item in add_endpoint(
        "Cadastral Parcel Full Attributes", "GET", "/api/v1/addresses/{address_id}", "Public",
        "Retrieves legal parcel attributes including Lot/DP numbers, title reference, zoning code, and service connections.",
        "GET http://127.0.0.1:8000/api/v1/addresses/PARCEL-4015-GNR",
        '{"id": "PARCEL-4015-GNR", "lotNumber": "Lot 14", "dpNumber": "DP 48291", "titleReference": "NA192/441", "areaM2": 812.0, "services": {"waterConnected": true, "meterLocation": "Front berm"}}'
    ): story.append(item)

    story.append(PageBreak())

    # 4.7 Parcel Water Supply
    for item in add_endpoint(
        "Verified Water Supply for Known Address", "GET", "/api/v1/addresses/{address_id}/water-supply", "Public",
        "Retrieves verified water supply zone and infrastructure lineage for a known registered parcel.",
        "GET http://127.0.0.1:8000/api/v1/addresses/PARCEL-4015-GNR/water-supply\nAuthorization: Bearer {{officialToken}}",
        '{"status": "VERIFIED", "queriedAddress": "4015 Great North Road", "supplyZone": {"zoneId": "AKL-SZ-14", "zoneName": "Waitakere Dizzy"}, "matchedPipeCompkey": 2017826}'
    ): story.append(item)

    # 4.8 7-Step Authoritative Resolution Engine
    for item in add_endpoint(
        "7-Step Authoritative Water Supply Resolution", "POST", "/api/v1/water-supply/resolve", "Public",
        "Executes 7-step spatial resolution connecting address or coordinates to supply zone and infrastructure lineage.",
        'POST http://127.0.0.1:8000/api/v1/water-supply/resolve\nContent-Type: application/json\n\n{"address": "4015 Great North Road, Kelston, Auckland 0602"}',
        '{"status": "VERIFIED", "queriedAddress": "4015 Great North Road", "nztm2000": {"easting": 1748200.0, "northing": 5914300.0}, "supplyZone": {"zoneId": "AKL-SZ-14", "zoneName": "Waitakere Dizzy"}, "lineage": {"sourceDam": {"name": "Waitakere Dam"}, "treatmentPlant": {"name": "Huia WTP"}}}'
    ): story.append(item)

    # 4.9 Supply Zones List
    for item in add_endpoint(
        "Drinking Water Supply Zones (AklDizzy)", "GET", "/api/v1/zones?limit=10", "Public",
        "Lists authoritative Auckland drinking water supply zones with population metrics and compliance status.",
        "GET http://127.0.0.1:8000/api/v1/zones?limit=2",
        '[{"zoneId": "AKL-SZ-14", "zoneName": "Waitakere Dizzy", "registeredPopulation": 182400, "supplierName": "Watercare Services Limited"}]'
    ): story.append(item)

    # 4.10 Supply Zone by ID
    for item in add_endpoint(
        "Supply Zone Detailed Spatial Geometry", "GET", "/api/v1/zones/{zone_id}", "Public",
        "Retrieves detailed spatial boundary MultiPolygon and demographic metrics for a specific zone.",
        "GET http://127.0.0.1:8000/api/v1/zones/AKL-SZ-14",
        '{"zoneId": "AKL-SZ-14", "zoneName": "Waitakere Dizzy", "registeredPopulation": 182400, "maoriPopulation": 24500, "geometry": {"type": "MultiPolygon", "coordinates": [...]}}'
    ): story.append(item)

    # 4.11 Concentric Buffers
    for item in add_endpoint(
        "Concentric Protection Buffer Corridors", "GET", "/api/v1/zones/{zone_id}/buffers", "Public",
        "Retrieves 50m, 100m, 200m, 500m, and 1500m risk assessment buffer tiers for spatial proximity evaluation.",
        "GET http://127.0.0.1:8000/api/v1/zones/AKL-SZ-14/buffers",
        '[{"tier": "CRITICAL_PROXIMITY", "distanceMeters": 50.0, "action": "Immediate contamination notification"}, {"tier": "BUFFER_100M", "distanceMeters": 100.0}]'
    ): story.append(item)

    # 4.12 Water Schemes List
    for item in add_endpoint(
        "Drinking Water Supply Schemes", "GET", "/api/v1/networks", "Public",
        "Lists registered municipal drinking water schemes across the Auckland region.",
        "GET http://127.0.0.1:8000/api/v1/networks",
        '[{"supplyId": "SUP-AKL-001", "supplyName": "Auckland Municipal Watercare Network", "supplierName": "Watercare Services Limited", "complianceStatus": "Rule Compliant (Grade A1)"}]'
    ): story.append(item)

    # 4.13 Water Scheme by ID
    for item in add_endpoint(
        "Water Supply Scheme Details", "GET", "/api/v1/networks/{network_id}", "Public",
        "Retrieves detailed drinking water scheme metadata by unique supply identifier.",
        "GET http://127.0.0.1:8000/api/v1/networks/SUP-AKL-001",
        '{"supplyId": "SUP-AKL-001", "supplyName": "Auckland Municipal Watercare Network", "sourceWaterType": "Surface Water & River Catchment", "registeredPopulation": 1580000}'
    ): story.append(item)

    story.append(PageBreak())

    # 4.14 Reticulation Assets (Redaction Comparison)
    for item in add_endpoint(
        "Reticulation Asset Inspection (RBAC Redacted)", "GET", "/api/v1/assets?category=reticulation_main", "Public / Official",
        "Retrieves physical water assets. Public users receive REDACTED fields (null); Officials receive full telemetry.",
        "GET http://127.0.0.1:8000/api/v1/assets?category=reticulation_main\nAuthorization: Bearer {{officialToken}}",
        '[{"compkey": 2017820, "assetName": "Great North Road Watermain", "nominalDiameterMm": 150, "material": "Ductile Iron", "cctvConditionScore": 2, "invertDepthM": 1.45, "engineerNotes": "Inspected July 2024. Grade 2 minor internal lining wear."}]'
    ): story.append(item)

    # 4.15 Asset by COMPKEY
    for item in add_endpoint(
        "Detailed Asset by Watercare COMPKEY", "GET", "/api/v1/assets/{compkey}", "Public / Official",
        "Retrieves authoritative physical infrastructure asset by unique engineering COMPKEY.",
        "GET http://127.0.0.1:8000/api/v1/assets/2017820\nAuthorization: Bearer {{officialToken}}",
        '{"compkey": 2017820, "assetCategory": "reticulation_main", "nominalDiameterMm": 150, "material": "Ductile Iron", "pressureClass": "PN16", "cctvConditionScore": 2, "invertDepthM": 1.45}'
    ): story.append(item)

    # 4.16 Incident Intake
    for item in add_endpoint(
        "Citizen Water Incident Complaint Intake", "POST", "/api/v1/incidents", "Public",
        "Logs citizen contamination complaints and automatically assigns an official reference (e.g., NZ-DW-2026-4821).",
        'POST http://127.0.0.1:8000/api/v1/incidents\nContent-Type: application/json\n\n{"category": "contamination_discoloration", "address": "4015 Great North Road", "description": "Brown water from tap", "severity": "high"}',
        '{"id": "NZ-DW-2026-4821", "status": "Submitted", "createdAt": "2026-10-13T02:40:00Z", "category": "contamination_discoloration", "boilWaterAdvised": true}'
    ): story.append(item)

    # 4.17 List Incidents
    for item in add_endpoint(
        "List Registered Incident Complaints", "GET", "/api/v1/incidents?status={status}", "Public",
        "Lists reported incident complaints with optional filtering by investigation status or zone ID.",
        "GET http://127.0.0.1:8000/api/v1/incidents?status=Submitted",
        '[{"id": "NZ-DW-2026-4821", "status": "Submitted", "category": "contamination_discoloration", "address": "4015 Great North Road", "severity": "high"}]'
    ): story.append(item)

    # 4.18 Update Incident by Official
    for item in add_endpoint(
        "Official Incident Status & Triage Update", "PATCH", "/api/v1/incidents/{incident_id}", "Official / Admin",
        "Updates incident investigation progress, sampling orders, and compliance officer notes.",
        'PATCH http://127.0.0.1:8000/api/v1/incidents/NZ-DW-2026-4821\nAuthorization: Bearer {{officialToken}}\nContent-Type: application/json\n\n{"status": "Under Investigation", "officerNotes": "Water sampling kit dispatched to Kelston."}',
        '{"id": "NZ-DW-2026-4821", "status": "Under Investigation", "officerNotes": "Water sampling kit dispatched to Kelston.", "boilWaterAdvised": true}'
    ): story.append(item)

    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 5: RBAC REDACTION SHOWCASE
    # =========================================================================
    story.append(PageBreak())
    story.append(Paragraph("5. Deep-Dive: RBAC Telemetry Redaction in Action", h1_style))
    story.append(Paragraph(
        "To verify security governance in VS Code, execute <code>GET /api/v1/assets/2017820</code> with and without "
        "the <code>Authorization: Bearer {{officialToken}}</code> header. Notice the exact field-level differences below:",
        body_style
    ))

    redact_comp_data = [
        [
            Paragraph("Public Citizen View (Unauthenticated / Citizen)", table_header_style),
            Paragraph("Official Regulatory View (Authorized Official)", table_header_style)
        ],
        [
            Paragraph("""<code>{<br/>
&nbsp;&nbsp;"compkey": 2017820,<br/>
&nbsp;&nbsp;"assetName": "Great North Road Main",<br/>
&nbsp;&nbsp;"nominalDiameterMm": 150,<br/>
&nbsp;&nbsp;"material": "Ductile Iron",<br/>
&nbsp;&nbsp;<b>"cctvConditionScore": null</b>,<br/>
&nbsp;&nbsp;<b>"invertDepthM": null</b>,<br/>
&nbsp;&nbsp;<b>"engineerNotes": null</b><br/>
}</code>""", code_style),
            Paragraph("""<code>{<br/>
&nbsp;&nbsp;"compkey": 2017820,<br/>
&nbsp;&nbsp;"assetName": "Great North Road Main",<br/>
&nbsp;&nbsp;"nominalDiameterMm": 150,<br/>
&nbsp;&nbsp;"material": "Ductile Iron",<br/>
&nbsp;&nbsp;<b>"cctvConditionScore": 2</b>,<br/>
&nbsp;&nbsp;<b>"invertDepthM": 1.45</b>,<br/>
&nbsp;&nbsp;<b>"engineerNotes": "Inspected July 2024..."</b><br/>
}</code>""", code_style)
        ]
    ]
    t_redact = Table(redact_comp_data, colWidths=[252, 252])
    t_redact.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), MUTED),
        ('BACKGROUND', (1, 0), (1, 0), NAVY),
        ('BACKGROUND', (0, 1), (-1, -1), BG_CODE),
        ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_redact)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 6: TROUBLESHOOTING & FAQ
    # =========================================================================
    story.append(Paragraph("6. VS Code Troubleshooting & Quick Solutions", h1_style))
    story.append(Paragraph(
        "Common developer scenarios encountered during local development and their verified resolutions:",
        body_style
    ))

    faq_data = [
        [
            Paragraph("Issue / Symptom", table_header_style),
            Paragraph("Root Cause", table_header_style),
            Paragraph("Resolution in VS Code", table_header_style)
        ],
        [
            Paragraph("<b>401 Unauthorized</b> on protected endpoints", table_cell_style),
            Paragraph("Missing or expired JWT bearer token in Authorization header", table_cell_style),
            Paragraph("Run the <code>officialLogin</code> request in <code>backend_api.http</code> first to refresh <code>{{officialToken}}</code>.", table_cell_style),
        ],
        [
            Paragraph("<b>ModuleNotFoundError: No module named 'fastapi'</b>", table_cell_style),
            Paragraph("VS Code is pointing to the global system Python instead of <code>.venv</code>", table_cell_style),
            Paragraph("Press <code>Ctrl+Shift+P</code> &rarr; <b>Python: Select Interpreter</b> &rarr; Choose <code>.venv/bin/python</code>.", table_cell_style),
        ],
        [
            Paragraph("<b>Connection Refused (port 8000)</b>", table_cell_style),
            Paragraph("The FastAPI backend process is not currently running", table_cell_style),
            Paragraph("Press <b>F5</b> to launch the server, or run Task <b>Start FastAPI Backend</b> from the Command Palette.", table_cell_style),
        ],
        [
            Paragraph("<b>CORS Error in Browser</b>", table_cell_style),
            Paragraph("Frontend port (e.g. 3000) not listed in backend CORS origins", table_cell_style),
            Paragraph("Ports 3000, 5173, and 4173 are pre-whitelisted in <code>backend/app/core/config.py</code>. Restart backend if modified.", table_cell_style),
        ],
        [
            Paragraph("<b>Database reset needed</b>", table_cell_style),
            Paragraph("Corrupted or outdated local test data in SQLite file", table_cell_style),
            Paragraph("Run <code>Terminal: Run Task</code> &rarr; <b>Re-Seed Spatial SQLite DB</b> to restore clean state in 1 second.", table_cell_style),
        ],
    ]
    t_faq = Table(faq_data, colWidths=[130, 150, 224])
    t_faq.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_faq)
    story.append(Spacer(1, 12))

    summary_box = [
        [Paragraph(
            "<b>Developer Action Checklist:</b><br/>"
            "1. Open <b><code>backend/backend_api.http</code></b> in VS Code and click <code>Send Request</code> above any query.<br/>"
            "2. Press <b>F5</b> to launch interactive debugging with real-time breakpoints.<br/>"
            "3. Run <b><code>npm run dev</code></b> in terminal to launch the full Leaflet GIS client on port 3000.",
            callout_style
        )]
    ]
    t_summary = Table(summary_box, colWidths=[504])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 1.5, CYAN),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_summary)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[✓] Successfully generated professional developer PDF at: {output_path}")

if __name__ == "__main__":
    output_dir = Path("/Volumes/SSD/ENZ/Repository/water-testing/docs")
    output_dir.mkdir(parents=True, exist_ok=True)
    target_pdf = output_dir / "VS_CODE_BACKEND_DEVELOPER_GUIDE.pdf"
    build_pdf(str(target_pdf))
