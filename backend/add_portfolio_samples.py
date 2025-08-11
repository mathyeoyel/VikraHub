#!/usr/bin/env python3
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vikrahub.settings')
django.setup()

from core.models import PortfolioItem, User

def add_sample_portfolio_items():
    print("=== Adding Sample Portfolio Items ===\n")
    
    # Get some users to add portfolio items to
    users = User.objects.filter(id__in=[2, 3, 4])  # mathewyel, testuser3, yakyak
    
    sample_images = [
        "https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1234567890/sample_2.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1234567890/sample_3.jpg",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop",
        "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=500&h=300&fit=crop",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&h=300&fit=crop"
    ]
    
    sample_items = [
        {
            "title": "E-commerce Website Design",
            "description": "Modern responsive e-commerce website with clean UI/UX design",
            "url": "https://github.com/user/ecommerce-project",
            "tags": "web design, ui/ux, ecommerce, responsive"
        },
        {
            "title": "Mobile Banking App UI",
            "description": "Intuitive mobile banking application interface design",
            "url": "https://dribbble.com/shots/banking-app",
            "tags": "mobile app, ui design, banking, fintech"
        },
        {
            "title": "Brand Identity Package",
            "description": "Complete brand identity design including logo, colors, and typography",
            "url": "https://behance.net/gallery/brand-identity",
            "tags": "branding, logo design, identity, graphic design"
        },
        {
            "title": "Digital Marketing Campaign",
            "description": "Successful social media marketing campaign for tech startup",
            "url": "https://example.com/portfolio/marketing",
            "tags": "digital marketing, social media, campaigns, strategy"
        },
        {
            "title": "Restaurant Website",
            "description": "Elegant restaurant website with online ordering system",
            "url": "https://github.com/user/restaurant-site",
            "tags": "web development, restaurant, ordering system, cms"
        },
        {
            "title": "Photography Portfolio",
            "description": "Professional photography portfolio showcase",
            "url": "https://photographer.com/portfolio",
            "tags": "photography, portfolio, gallery, visual"
        }
    ]
    
    # Add items to users
    item_index = 0
    for user in users:
        print(f"Adding portfolio items for {user.username}")
        
        # Add 2 items per user
        for i in range(2):
            if item_index < len(sample_items):
                item_data = sample_items[item_index]
                image_url = sample_images[item_index % len(sample_images)]
                
                # Check if item already exists
                existing = PortfolioItem.objects.filter(
                    user=user, 
                    title=item_data["title"]
                ).first()
                
                if existing:
                    # Update existing item with image
                    existing.image = image_url
                    existing.save()
                    print(f"  ✅ Updated: {item_data['title']}")
                else:
                    # Create new item
                    PortfolioItem.objects.create(
                        user=user,
                        title=item_data["title"],
                        description=item_data["description"],
                        image=image_url,
                        url=item_data["url"],
                        tags=item_data["tags"]
                    )
                    print(f"  ➕ Created: {item_data['title']}")
                
                item_index += 1
    
    print(f"\n✅ Portfolio setup complete!")
    
    # Summary
    total_items = PortfolioItem.objects.count()
    items_with_images = PortfolioItem.objects.exclude(image__isnull=True).exclude(image__exact='').count()
    
    print(f"📊 Summary:")
    print(f"  Total portfolio items: {total_items}")
    print(f"  Items with images: {items_with_images}")
    print(f"  Items without images: {total_items - items_with_images}")

if __name__ == "__main__":
    add_sample_portfolio_items()
