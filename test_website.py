from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")
        
        print("Waiting for network idle...")
        page.wait_for_load_state("networkidle")
        
        # Check for errors in console
        page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))
        
        print("Taking screenshots...")
        page.screenshot(path="full_page.png", full_page=True)
        
        # Check for empty heights or layout issues
        features = page.query_selector_all(".container h2")
        for h2 in features:
            print(f"Heading found: {h2.inner_text()}")

        # Check for specific elements that might have issues
        cards = page.query_selector_all(".grid > div")
        print(f"Found {len(cards)} cards in the grid.")
        for i, card in enumerate(cards):
            box = card.bounding_box()
            if box:
                print(f"Card {i} height: {box['height']}px")
            else:
                print(f"Card {i} has no bounding box")

        # Check for the Marquee artifact
        marquees = page.query_selector_all(".rfm-marquee") # React Fast Marquee classes usually start with rfm
        print(f"Found {len(marquees)} marquees.")
        
        browser.close()

if __name__ == "__main__":
    run()
