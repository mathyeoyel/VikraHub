import requests
import json

# Test production API to see what portfolio items exist there
production_api_url = "https://api.vikrahub.com/api/portfolio/"

print("Checking production portfolio items...")
print("=" * 50)

try:
    response = requests.get(production_api_url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Total items: {len(data)}")
        print()
        
        for i, item in enumerate(data, 1):
            print(f"Item {i}:")
            print(f"  ID: {item.get('id')}")
            print(f"  Title: '{item.get('title', 'No title')}'")
            print(f"  Image: '{item.get('image', 'No image')}'")
            print(f"  URL: '{item.get('url', 'No URL')}'")
            print(f"  Tags: '{item.get('tags', 'No tags')}'")
            
            # Check for W.png reference
            image = item.get('image', '')
            if 'W.png' in image or 'w.png' in image:
                print(f"  🚨 FOUND W.PNG REFERENCE: {image}")
                print(f"  🗑️  This item needs to be deleted!")
            elif image and not image.startswith('http') and image.endswith('.png'):
                print(f"  ⚠️  Suspicious local PNG file: {image}")
            
            print()
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Error connecting to production API: {e}")

print("Done!")
