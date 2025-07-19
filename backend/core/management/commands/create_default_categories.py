from django.core.management.base import BaseCommand
from core.models import AssetCategory

class Command(BaseCommand):
    help = 'Create default asset categories'

    def handle(self, *args, **options):
        categories = [
            {'name': 'Graphics', 'description': 'Graphic design assets, logos, and illustrations', 'icon': '🎨'},
            {'name': 'Templates', 'description': 'Website templates, presentation templates, and design templates', 'icon': '📄'},
            {'name': 'UI Kits', 'description': 'User interface design kits and components', 'icon': '📱'},
            {'name': 'Icons', 'description': 'Icon sets and individual icons', 'icon': '🎯'},
            {'name': 'Illustrations', 'description': 'Digital illustrations and artwork', 'icon': '🖼️'},
            {'name': 'Photography', 'description': 'Stock photos and photography assets', 'icon': '📷'},
            {'name': 'Vectors', 'description': 'Vector graphics and SVG files', 'icon': '📐'},
            {'name': 'Mockups', 'description': 'Product mockups and design presentations', 'icon': '📋'},
            {'name': 'Fonts', 'description': 'Typography and font files', 'icon': '✍️'},
            {'name': 'Audio', 'description': 'Sound effects and music tracks', 'icon': '🎵'},
            {'name': 'Video', 'description': 'Video templates and motion graphics', 'icon': '🎬'},
            {'name': 'Code', 'description': 'Code snippets and programming assets', 'icon': '💻'},
        ]

        created_count = 0
        for category_data in categories:
            category, created = AssetCategory.objects.get_or_create(
                name=category_data['name'],
                defaults={
                    'description': category_data['description'],
                    'icon': category_data['icon']
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} new categories')
        )
