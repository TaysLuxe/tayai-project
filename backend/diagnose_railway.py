#!/usr/bin/env python3
"""
Diagnostic script to check Railway environment
Run this first to understand what Railway sees
"""
import os
import sys
from pathlib import Path

print("=" * 60)
print("RAILWAY ENVIRONMENT DIAGNOSTICS")
print("=" * 60)

print(f"\nPython executable: {sys.executable}")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Script location: {Path(__file__).absolute()}")
print(f"Script directory: {Path(__file__).parent.absolute()}")

print(f"\nPython path:")
for p in sys.path:
    print(f"  - {p}")

print(f"\nFiles in current directory:")
try:
    for item in sorted(Path.cwd().iterdir()):
        print(f"  - {item.name} ({'DIR' if item.is_dir() else 'FILE'})")
except Exception as e:
    print(f"  Error listing directory: {e}")

print(f"\nFiles in script directory ({Path(__file__).parent.absolute()}):")
try:
    for item in sorted(Path(__file__).parent.iterdir()):
        if item.is_file() and item.suffix in ['.py', '.sh']:
            print(f"  - {item.name}")
except Exception as e:
    print(f"  Error listing directory: {e}")

print(f"\nChecking for seed_users.py:")
possible_locations = [
    Path.cwd() / "seed_users.py",
    Path(__file__).parent / "seed_users.py",
    Path.cwd() / "backend" / "seed_users.py",
]

for loc in possible_locations:
    exists = loc.exists()
    print(f"  {loc}: {'EXISTS' if exists else 'NOT FOUND'}")

print("\n" + "=" * 60)
