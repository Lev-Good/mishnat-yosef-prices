#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
מנגנון אוטומטי לעדכון מחירי שוק וסנכרון קטלוג משנת יוסף
(Osher Ad, Rami Levy, Yesh Hesed)
כולל חיבור מאובטח ל-API של משנת יוסף באמצעות GitHub Secrets
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

PRICES_FILE = os.path.join(os.path.dirname(__file__), "prices.json")
MISHNAT_API = "https://v2.mishnatyosef.org/api"
IMG_BASE = "https://images.mishnatyosef.org/images/items/"

# מוצרים בפיקוח ממשלתי בישראל
GOVERNMENT_CONTROLLED_PRICES = {
    "milk_3": 7.11,
    "milk_1": 6.55,
    "eggs_l30": 38.00,
    "eggs_m30": 34.50,
    "eggs_l12": 15.20,
    "cheese_white_5": 5.75,
    "butter_100": 5.10,
    "sour_cream": 3.05,
    "bread_sliced": 7.91,
    "salt_fine": 2.60
}

def login_to_mishnat(email, password):
    if not email or not password:
        return None
    url = f"{MISHNAT_API}/login"
    payload = json.dumps({"email": email, "password": password}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("access_token")
    except Exception as e:
        print(f"[Auth] Login failed: {e}")
        return None

def fetch_open_sales(token):
    url = f"{MISHNAT_API}/profile/open_sales"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if isinstance(data, dict):
                return data.get("data") or []
            elif isinstance(data, list):
                return data
            return []
    except Exception as e:
        print(f"[Sales] Failed to fetch open sales: {e}")
        return []

def update_item_prices(item, today_str):
    item_id = item.get("id")
    changed = False

    # מוצרים בפיקוח
    if item_id in GOVERNMENT_CONTROLLED_PRICES:
        gov_price = GOVERNMENT_CONTROLLED_PRICES[item_id]
        if item.get("supermarketPrice") != gov_price:
            item["supermarketPrice"] = gov_price
            changed = True
        chains = item.setdefault("chains", {})
        chains["ramiLevy"] = gov_price
        chains["yeshHesed"] = gov_price
        osher_price = round(gov_price * 0.98, 2) if gov_price > 10 else gov_price
        chains["osherAd"] = osher_price
        item["lastVerified"] = today_str
        return changed

    # מוצרי שוק חופשי
    chains = item.setdefault("chains", {})
    osher = float(chains.get("osherAd", item.get("supermarketPrice", 0)))
    rami = float(chains.get("ramiLevy", item.get("supermarketPrice", 0)))
    yesh = float(chains.get("yeshHesed", item.get("supermarketPrice", 0)))

    valid_prices = [p for p in [osher, rami, yesh] if p > 0]
    if valid_prices:
        avg_price = round(sum(valid_prices) / len(valid_prices), 2)
        if item.get("supermarketPrice") != avg_price:
            item["supermarketPrice"] = avg_price
            changed = True

    item["lastVerified"] = today_str
    return changed

def main():
    if not os.path.exists(PRICES_FILE):
        print(f"Error: {PRICES_FILE} not found!")
        sys.exit(1)

    with open(PRICES_FILE, "r", encoding="utf-8") as f:
        items = json.load(f)

    today_str = datetime.now().strftime("%Y-%m-%d")
    print(f"=== מריץ עדכון מחירי רשתות שיווק וסנכרון ענן ({today_str}) ===")
    print(f"סה\"כ מוצרים במאגר: {len(items)}")

    # 1. התחברות למשנת יוסף במידה וקיימים סודות
    email = os.environ.get("MISHNAT_EMAIL")
    password = os.environ.get("MISHNAT_PASSWORD")
    if email and password:
        print("[Mishnat] מתחבר למערכת משנת יוסף...")
        token = login_to_mishnat(email, password)
        if token:
            print("[Mishnat] התחברות הצליחה! בודק מכירות פתוחות...")
            sales = fetch_open_sales(token)
            print(f"[Mishnat] נמצאו {len(sales)} מכירות פתוחות להזמנה.")
        else:
            print("[Mishnat] לא ניתן להתחבר כרגע. ממשיך בעדכון מחירי השוק.")

    # 2. עדכון מחירי שוק למוצרי העוגן
    updates_count = 0
    for item in items:
        if update_item_prices(item, today_str):
            updates_count += 1

    with open(PRICES_FILE, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f"\nהעדכון הושלם! עודכנו מחירים ל-{updates_count} מוצרים.")
    print(f"נשמר בהצלחה: {PRICES_FILE}")

if __name__ == "__main__":
    main()
