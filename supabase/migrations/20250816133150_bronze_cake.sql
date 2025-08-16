/*
  # Remove all photo-related functions

  1. Functions to remove
    - get_user_photos_with_tags
    - get_photos_by_tag
    - get_photos_with_tags
    - debug_photo_categories
    - search_public_photos
    - search_public_photos_with_profile
    - get_user_email
*/

-- Drop all photo-related functions
DROP FUNCTION IF EXISTS get_user_photos_with_tags(uuid);
DROP FUNCTION IF EXISTS get_photos_by_tag(uuid, text);
DROP FUNCTION IF EXISTS get_photos_with_tags(uuid);
DROP FUNCTION IF EXISTS debug_photo_categories(uuid);
DROP FUNCTION IF EXISTS search_public_photos(text);
DROP FUNCTION IF EXISTS search_public_photos_with_profile(text);
DROP FUNCTION IF EXISTS get_user_email(uuid);