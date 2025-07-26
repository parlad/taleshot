/*
  # Remove description field from photos table

  1. Changes
    - Drop 'description' column from photos table
    - Remove NOT NULL constraint since we're removing the column

  2. Notes
    - This is a safe migration that only removes a column
    - No data preservation needed as the field is being removed
*/

ALTER TABLE photos
DROP COLUMN description;