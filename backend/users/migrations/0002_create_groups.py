"""
Data migration: Create default Django auth Groups (Patient, Doctor, Admin)
that mirror the custom role field.
"""
from django.db import migrations


def create_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    for name in ['Patient', 'Doctor', 'Admin']:
        Group.objects.get_or_create(name=name)


def delete_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name__in=['Patient', 'Doctor', 'Admin']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.RunPython(create_groups, delete_groups),
    ]
