#!/usr/bin/env python3
"""
Taumata Arowai GIS Platform - Database Management & Inspection CLI
Use this tool to view, edit, inspect, and manage your standalone database.

Commands:
    python backend/manage_db.py info         - Show database status and record counts
    python backend/manage_db.py list-zones   - List all drinking water supply zones
    python backend/manage_db.py list-schemes - List all registered water schemes
    python backend/manage_db.py list-users   - List user accounts and RBAC roles
    python backend/manage_db.py list-assets  - List key infrastructure assets
    python backend/manage_db.py reseed       - Re-run database seeder
"""

import sys
import argparse
from pathlib import Path

# Ensure backend package is in python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.db.session import SessionLocal, engine, Base
from backend.app.db.models import (
    AppUser,
    WaterSupplyScheme,
    WaterSupplyZone,
    ZoneDemographic,
    WaterNetworkAsset,
    WaterIncident,
    SpatialPropertyQuery,
)
from backend.app.db.seed import seed_database
from backend.app.core.config import settings

def show_info():
    db = SessionLocal()
    try:
        print("\n" + "=" * 60)
        print("  TAUMATA AROWAI GIS - DATABASE STATUS")
        print("=" * 60)
        print(f"Database URL: {settings.DATABASE_URL}")
        
        users_count = db.query(AppUser).count()
        schemes_count = db.query(WaterSupplyScheme).count()
        zones_count = db.query(WaterSupplyZone).count()
        assets_count = db.query(WaterNetworkAsset).count()
        incidents_count = db.query(WaterIncident).count()
        queries_count = db.query(SpatialPropertyQuery).count()

        print(f"• Supply Schemes:           {schemes_count} schemes registered")
        print(f"• Water Supply Zones:       {zones_count} spatial zones (AklDizzy)")
        print(f"• Network Assets:           {assets_count} infrastructure assets")
        print(f"• Incident Reports:         {incidents_count} citizen complaints")
        print(f"• User Accounts (RBAC):     {users_count} registered users")
        print(f"• Spatial Resolution Logs:  {queries_count} address queries logged")
        print("=" * 60 + "\n")
    finally:
        db.close()

def list_zones():
    db = SessionLocal()
    try:
        zones = db.query(WaterSupplyZone).order_by(WaterSupplyZone.zone_id).all()
        print(f"\nRegistered Drinking Water Supply Zones ({len(zones)} total):")
        print("-" * 75)
        print(f"{'Zone ID':<12} | {'Zone Name':<32} | {'Scheme ID':<18} | {'Pop':<8}")
        print("-" * 75)
        for z in zones:
            pop = z.demographics.pop_registered if z.demographics else z.zone_population
            print(f"{z.zone_id:<12} | {z.zone_name[:32]:<32} | {z.supply_id:<18} | {pop:<8}")
        print("-" * 75 + "\n")
    finally:
        db.close()

def list_schemes():
    db = SessionLocal()
    try:
        schemes = db.query(WaterSupplyScheme).all()
        print(f"\nRegistered Drinking Water Supply Schemes ({len(schemes)} total):")
        print("-" * 80)
        print(f"{'Scheme ID':<18} | {'Scheme Name':<38} | {'Compliance':<15}")
        print("-" * 80)
        for s in schemes:
            print(f"{s.supply_id:<18} | {s.supply_name[:38]:<38} | {s.compliance_status:<15}")
        print("-" * 80 + "\n")
    finally:
        db.close()

def list_users():
    db = SessionLocal()
    try:
        users = db.query(AppUser).all()
        print(f"\nUser Accounts & RBAC Roles ({len(users)} total):")
        print("-" * 80)
        print(f"{'Role':<10} | {'Full Name':<20} | {'Email':<35} | {'Active'}")
        print("-" * 80)
        for u in users:
            print(f"{u.role:<10} | {u.full_name[:20]:<20} | {u.email[:35]:<35} | {u.is_active}")
        print("-" * 80 + "\n")
    finally:
        db.close()

def list_assets():
    db = SessionLocal()
    try:
        assets = db.query(WaterNetworkAsset).all()
        print(f"\nInfrastructure Network Assets ({len(assets)} total):")
        print("-" * 80)
        print(f"{'COMPKEY':<10} | {'Category':<18} | {'Asset Name':<35} | {'Parent Zone'}")
        print("-" * 80)
        for a in assets:
            print(f"{a.compkey:<10} | {a.asset_category:<18} | {a.asset_name[:35]:<35} | {a.parent_zone_id or 'N/A'}")
        print("-" * 80 + "\n")
    finally:
        db.close()

def reseed():
    db = SessionLocal()
    try:
        print("\n[*] Re-running database seeder...")
        seed_database(db)
        print("[✓] Reseeding complete.\n")
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Taumata Arowai Database Management CLI")
    parser.add_argument("command", choices=["info", "list-zones", "list-schemes", "list-users", "list-assets", "reseed"],
                        help="Action to perform")
    args = parser.parse_args()

    if args.command == "info":
        show_info()
    elif args.command == "list-zones":
        list_zones()
    elif args.command == "list-schemes":
        list_schemes()
    elif args.command == "list-users":
        list_users()
    elif args.command == "list-assets":
        list_assets()
    elif args.command == "reseed":
        reseed()

if __name__ == "__main__":
    main()
