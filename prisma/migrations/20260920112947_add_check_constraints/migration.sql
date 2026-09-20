-- This is an empty migration.

ALTER TABLE "Review"
ADD CONSTRAINT "review_rating_range" CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE "Product"
ADD CONSTRAINT "product_price_positive" CHECK (price >= 0);

ALTER TABLE "Product"
ADD CONSTRAINT "product_views_positive" CHECK (views >= 0);

ALTER TABLE "Image"
ADD CONSTRAINT "image_order_positive" CHECK ("order" >= 0);

ALTER TABLE "Contact"
ADD CONSTRAINT "contact_latitude_range"
CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);

ALTER TABLE "Contact"
ADD CONSTRAINT "contact_longitude_range"
CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);